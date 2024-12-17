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

let notifications=[]

app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use(express.json())


app.use(session({
    name: 'cookieSid',
    secret: process.env.SESSION_SECRET, // κλειδί για κρυπτογράφηση του cookie
    resave: false, // δεν χρειάζεται να αποθηκεύεται αν δεν αλλάξει
    saveUninitialized: true, //  αποθήκευση session id για κάθε client
    cookie: {
      secure:true,
      sameSite: true,
      httpOnly:true,
    }
  }));


// HTTPS options
const options = {
    key: fs.readFileSync('./certificates/key.pem'),
    cert: fs.readFileSync('./certificates/cert.pem')
};

function redirectToHttps(req, res, next) {
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

app.post('/endSession',express.text(),(req,res)=>{
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (error) {
            console.error('Invalid JSON in request body');
            return res.status(400).send('Invalid JSON');
        }
    }

    req.session.destroy();

    const sessionId = body.sessionId;

    notifications = notifications.filter(notification => notification.sessionId !== sessionId);
    console.log('delete ',notifications)

    res.status(200).send('Session ended');
})


app.post('/createNotification',(req,res)=>{
    const sessionId=req.sessionID
    const { city } = req.body;

    const notificationExists = notifications.find(notification => notification.sessionId === sessionId);

    if (!notificationExists){
        notifications.push({sessionId:sessionId,city:city})
        console.log('created',sessionId,city);

    }
    console.log(notifications)

    // Optionally send a response or just end the request
    res.status(204).end(); // No Content
})


async function getCurrentStatusOfParkingSpots() {
    
    const url = `http://150.140.186.118:1026/v2/entities?idPattern=^SmartCityParking_&limit=999`;
    
    const headers = {
        "Accept": "application/json",
        "FIWARE-ServicePath": "/SmartCityParking"
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
            
            data.push({
                coordinates: location,
                category: category,
                temperature: temperature,
                carParked: carParked,
                id: id
            })
        }
        return data

    } catch (error) {
        console.error(error.message);
    }
}

app.get('/api/data', async (req, res) => {
    const data = await getCurrentStatusOfParkingSpots()
    res.json(data); // Send the JSON data to the client
});

app.get('/', sendFile)


app.post('/action', async (req, res) => {
    const { action, message } = req.body;
    if (action === 'publish') {
        try {
            await mqttClient.publish(topic, message);
            res.json({ status: 'Message published', message });
        } catch (err) {
            res.status(500).json({ error: 'Failed to publish message', details: err.message });
        }
    } else if (action === 'clear') {
        sharedState.mqttMessages = [];
        res.json({ status: 'Messages cleared' });
    } else {
        res.status(400).json({ error: 'Unknown action' });
    }
});

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
    return { time, id, battery, carStatus, temperature, latitude, longitude };
}

const mqttClientPublish = asyncMqtt.connect(broker);

try {

    // akoui tis alages apo ton mqtt broker kai tis stelni san push notifications stous clients pou briskontai stin antistixi poli
    const mqttClientSubscribe = asyncMqtt.connect(broker);

    // Subscribe to the topic
    await mqttClientSubscribe.subscribe(topic);
    console.log(`Subscribed to MQTT topic: ${topic}`);

    // Handle incoming messages
    mqttClientSubscribe.on('message',  (topic, message) => {
        const city=topic.split("/")[1]
        const extractedData=extractData(message.toString())
        // [ { sessionId: 'HgZI9DM5yz3TzwLvDtNr59XSuMqOvjPP', city: 'Patras' } ]



        const data=JSON.stringify(extractedData, null, 2)

        notifications.forEach(notification=>{
            if (notification.city===city){
                topic=notification.sessionId
                mqttClientPublish.publish(topic, data);
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


https.createServer(options, app).listen(httpsPort, () => {
    console.log(`HTTPS server running at https://127.0.0.1:${httpsPort}`);
});

app.listen(httpPort, () => console.log(`HTTP server running at  http://127.0.0.1:${httpPort}/`));

