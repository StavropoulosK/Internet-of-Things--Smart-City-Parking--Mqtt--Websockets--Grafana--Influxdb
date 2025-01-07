import asyncMqtt from 'async-mqtt'
import express from 'express'

let mqttRouter = express.Router();

// Pinakas tis morfis [ { sessionId: 'HgZI9DM5yz3TzwLvDtNr59XSuMqOvjPP', city: 'Patras' , alive:2 } ]
let notifications = []

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

mqttRouter.get('/showAlive', (req, res) => {
    const notification = notifications.find(notification => notification.sessionId == req.sessionID)
    notification.alive = 2
    res.end()
})

mqttRouter.post('/createNotification', (req, res) => {
    const sessionId = req.sessionID
    const { city } = req.body;

    const notificationExists = notifications.find(notification => notification.sessionId === sessionId);

    if (!notificationExists) {
        notifications.push({ sessionId: sessionId, city: city, alive: 2 })
        console.log('created', sessionId, city);
    }

    res.status(204).end(); // No Content
});


function deleteDeadConnections() {
    const updatedNotifications = notifications.filter(notification => {
        if (notification.alive == 2) {
            notification.alive -= 1; // Reduce alive by 1
            return true; // Keep the item in the array
        }
        return false; // Remove the item 
    });

    notifications = [...updatedNotifications]
    // console.log('aaaa ',notifications)
    // console.log('\n\n\n\n')
}
setInterval(deleteDeadConnections, 1000 * 60 * 15);


// MQTT client setup to receive updates from the broker and notify the users based on their session ID

let mqttPublish;

const broker = "mqtt://150.140.186.118";
const topic = "smartCityParking/#";

async function setupMQTTClient() {
    try {
        // akoui tis alages apo ton mqtt broker kai tis stelni san push notifications stous clients pou briskontai stin antistixi poli
        const mqttClientSubscribe = asyncMqtt.connect(broker);

        mqttPublish = asyncMqtt.connect('ws://150.140.186.118:9001')

        // Subscribe to the topic
        await mqttClientSubscribe.subscribe(topic);
        console.log(`Subscribed to MQTT topic: ${topic}`);

        // Handle incoming messages
        mqttClientSubscribe.on('message', (topic, message) => {
            const city = topic.split("/")[1]
            const extractedData = extractData(message.toString())
            const data = JSON.stringify(extractedData, null, 2)

            notifications.forEach(notification => {
                if (notification.city === city) {
                    topic = notification.sessionId
                    mqttPublish.publish(topic, data);
                }
            });
        });

        // Handle errors
        mqttClientSubscribe.on('error', (err) => {
            console.error('MQTT Error:', err);
        });

    } catch (err) {
        console.error('Error initializing MQTT client:', err.message);
    }
}

function convertGreeceTimeToUTCTime(greeceTime) {
    // Create a new Date object from the local time string
    const localTime = new Date(greeceTime);

    // Convert to UTC and get the ISO string representation in UTC format
    const utcTime = localTime.toISOString();

    return utcTime
}

function extractData(messageString) {

    const message = JSON.parse(messageString);

    const time = convertGreeceTimeToUTCTime(message.time);
    const id = message.deviceInfo.deviceName.split(":")[1]; // Assuming id is part of the deviceName
    const battery = message.object.batteryVoltage;
    const carStatus = message.object.carStatus;
    const temperature = message.object.temperature;
    const latitude = message.rxInfo[0].location.latitude;
    const longitude = message.rxInfo[0].location.longitude;

    // Return the extracted data as an object
    return { time, id, carStatus, temperature, latitude, longitude };
}

async function updateMqtt(markerId, time, reservationUserId, city) {
    const data = {
        markerId: markerId,
        reservationTime: time
    }
    const message = JSON.stringify(data)

    notifications.forEach(notification => {
        const idOfUser = notification.sessionId
        if (notification.city === city && reservationUserId !== idOfUser) {

            const topic = notification.sessionId + 'Reservation' + city
            mqttPublish.publish(topic, message);
        }
    });
}


export { mqttRouter, setupMQTTClient, updateMqtt };