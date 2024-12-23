import express from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'
import session from "express-session";

import asyncMqtt  from'async-mqtt'

const broker = "mqtt://150.140.186.118";
const topic = "smartCityParking/#";

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpPort = process.env.SERVERPORT || 8080; // HTTP port
const httpsPort = 443; // HTTPS port

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Pinakas tis morfis [ { sessionId: 'HgZI9DM5yz3TzwLvDtNr59XSuMqOvjPP', city: 'Patras' , alive:2 } ]
let notifications=[]

app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use(express.json())


app.use(session({
    name: 'cookieSid',
    secret: process.env.SESSION_SECRET, // κλειδί για κρυπτογράφηση του cookie
    resave: false, // δεν χρειάζεται να αποθηκεύεται αν δεν αλλάξει
    saveUninitialized: true, //  αποθήκευση session id για κάθε client
    rolling:true,
    cookie: {
      secure:false,         // TRUE AN einai i sindesh httpS
      sameSite: true,
      httpOnly:true,
      maxAge: 15 * 60 * 1000    // 15 min

    }
  }));


// HTTPS options
const options = {
    key: fs.readFileSync('./certificates/key.pem'),
    cert: fs.readFileSync('./certificates/cert.pem')
};

function redirectToHttps(req, res, next) {
    next()
    return
    if (!req.secure) {
        const location = req.headers.host;
        const domain = location.slice(0, location.indexOf(':'));
        const secureUrl = 'https://' + domain + ':' + httpsPort + req.url;
        return res.redirect(secureUrl);
    }
    next()
}

function sendFile(req, res) {
    res.sendFile(path.join(__dirname, '/public/html/index.html'));
}

app.use(redirectToHttps)

app.get('/getMap', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/parkingMap.html'));

})

app.get('/getHeatMap', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/heatMap.html'));
})

app.get('/getDashboards', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/dashboards.html'));
})

app.get('/APIKEY', (req, res) => {
    res.send(GOOGLE_MAPS_API_KEY)
})

app.get('/getSession',(req,res)=>{
    const sessionId=req.sessionID

    res.json(sessionId)
})


app.post('/createNotification',(req,res)=>{
    const sessionId=req.sessionID
    const { city } = req.body;

    const notificationExists = notifications.find(notification => notification.sessionId === sessionId);

    if (!notificationExists){
        notifications.push({sessionId:sessionId,city:city,alive:2})
        console.log('created',sessionId,city);

    }
    console.log(notifications)

    res.status(204).end(); // No Content
})


async function getCurrentStatusOfParkingSpots(city) {
    
    const url = `http://150.140.186.118:1026/v2/entities?idPattern=^smartCityParking_&limit=999`;
    
    const headers = {
        "Accept": "application/json",
        "FIWARE-ServicePath": `/smartCityParking/${city}`
    };
    const data = []
    
    try {
        const response = await fetch(url, { headers } );
        const entities = await response.json();
        
        for (const  sensorData of entities) {
            const location = sensorData.location?.value?.coordinates;
            const carParked = sensorData.carParked?.value;
            const category = sensorData.category?.value
            const temperature = sensorData?.temperature?.value
            const id = (sensorData.id).split('_').pop();
            const utcTime= sensorData.occcupancyModified?.value
            const time= convertUtcTimeToLocalTime(utcTime)

            const timeOfLastReservation= convertUtcTimeToLocalTime(sensorData.timeOfLastReservation.value)
            const maximumParkingDuration= sensorData.maximumParkingDuration.value


            data.push({
                coordinates: location,
                category: category,
                temperature: temperature,
                carParked: carParked,
                id: id,
                time:time,
                timeOfLastReservation:timeOfLastReservation,
                maximumParkingDuration:maximumParkingDuration
            })
        }
        return data

    } catch (error) {
        console.error(error.message);
    }
}

app.get('/api/data', async (req, res) => {
    const id=req.sessionID
    const notif=notifications.find(notification=>notification.sessionId===id)
    const city=notif.city 
    const data = await getCurrentStatusOfParkingSpots(city)
    res.json(data)
});

app.get('/', sendFile)


// O server exei mia lista me tous clients stous opious stelni notifications meso ws kai mqtt kathe fora pou alazi i katastasi enos aisthitira stin poli tou client.
// Otan enas client aposindeetai prepei o server na stamatai na stelni notifications se auton
// H methodos navigator.sendBeacon mporei na stili ena aitima http ston server otan klini i efarmogi 
// gia na stamatisi ta notifications. Ostoso litourgi mono se desktop clients. Diladi an i efarmogi einai se
// kinito den stelnete to http request ston server otan klisi. https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon
// Omoios kai otan xrisimopoiithi i methodos fetch me keepalive: true 
// Gia auto ilopoiisame mia methodo opou o client stelni pings ston server ana 10 lepta oti i efarmogi einai anixti
// O server kathe 15 lepta kitai poies efarmoges stamatisan na stelnoun kai termatizi ta notifications.

// Arxika notifications.alive=2. An o server ektelesi to deleteDeadConnections (ginetai kathe 15 lepta) prin stalthi to epomeno ping oti i sindesi einai zontani
// tote tha gini notifications.alive=1. Meta tha stalthi to ping (ginetai kathe 10 lepta) kai tha ksanagini  notifications.alive=2, kai auto tha epanalambanetai.

app.get('/showAlive',(req,res)=>{

    const notification= notifications.find(notification=>notification.sessionId==req.sessionID)
    notification.alive=2
    res.end()
})

setInterval(deleteDeadConnections, 1000*60*15);

function deleteDeadConnections(){

    const updatedNotifications = notifications.filter(notification => {
        if (notification.alive == 2) {
            notification.alive -= 1; // Reduce alive by 1
            return true; // Keep the item in the array
        }
        return false; // Remove the item 
    });

    notifications=[...updatedNotifications]
    // console.log('aaaa ',notifications)
    // console.log('\n\n\n\n')

}


function extractData(messageString) {

    const message = JSON.parse(messageString);

    // Extract the required values
    const time = message.time;
    const id = message.deviceInfo.deviceName.split(":")[1]; // Assuming id is part of the deviceName
    const battery = message.object.batteryVoltage;
    const carStatus = message.object.carStatus;
    const temperature = message.object.temperature;
    const latitude = message.rxInfo[0].location.latitude;
    const longitude = message.rxInfo[0].location.longitude;

    // Return the extracted data as an object
    return { time, id, carStatus, temperature, latitude, longitude };
}

function convertUtcTimeToLocalTime(utcTime) {
    const date = new Date(utcTime); // Parse the UTC date string

    // Get individual components of the local time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    const localTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    return localTime;
}


try {

    // akoui tis alages apo ton mqtt broker kai tis stelni san push notifications stous clients pou briskontai stin antistixi poli
    const mqttClientSubscribe = asyncMqtt.connect(broker);

    const mqttPublish =  asyncMqtt.connect('ws://150.140.186.118:9001')

    // Subscribe to the topic
    await mqttClientSubscribe.subscribe(topic);
    console.log(`Subscribed to MQTT topic: ${topic}`);

    // Handle incoming messages
    mqttClientSubscribe.on('message',  (topic, message) => {
        const city=topic.split("/")[1]
        const extractedData=extractData(message.toString())



        const data=JSON.stringify(extractedData, null, 2)

        notifications.forEach(notification=>{
            if (notification.city===city){
                topic=notification.sessionId
                mqttPublish.publish(topic, data);

            }
        })
        
    });

    // Handle errors
    mqttClientSubscribe.on('error', (err) => {
        console.error('MQTT Error:', err);
    });

} catch (err) {
    console.error('Error initializing MQTT client:', err.message);
}

app.listen(httpPort, () => console.log(`HTTP server running at  http://127.0.0.1:${httpPort}/`));

// https.createServer(options, app).listen(httpsPort, () => {
//     console.log(`HTTPS server running at https://127.0.0.1:${httpsPort}`);
// });