import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'

import { updateMqtt } from './mqttClient.mjs';  

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let router = express.Router();

const fileLocation = path.join(__dirname, '../../public/html/');

router.get('/', (req, res) =>
    res.sendFile(fileLocation + 'index.html')
);

router.get('/getMap', (req, res) => {
    res.sendFile(fileLocation + 'parkingMap.html');
})

router.get('/getHeatMap', (req, res) => {
    res.sendFile(fileLocation + 'heatMap.html');
})

router.get('/getDashboards', (req, res) => {
    res.sendFile(fileLocation + 'dashboards.html');
})

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
router.get('/APIKEY', (req, res) => {
    res.send(GOOGLE_MAPS_API_KEY)
})

router.get('/getSession', (req, res) => {
    const sessionId = req.sessionID
    res.json(sessionId)
})

router.post('/makeReservation', async (req, res) => {

    // otan ginetai kratisi enimeroni ton context broker kai tous xristes

    const id = req.sessionID
    const notif = notifications.find(notification => notification.sessionId === id)
    const city = notif.city

    const { time, markerId } = req.body;

    const entity_id = 'smartCityParking_' + markerId

    const url = `http://150.140.186.118:1026/v2/entities/${entity_id}/attrs`;

    // Headers for the request
    const headers = {
        "Accept": "application/json",
        "FIWARE-ServicePath": `/smartCityParking/${city}`,
        "Content-Type": "application/json"
    };

    const payload = {
        "timeOfLastReservation": {
            "value": time,
            "type": "DateTime"
        }
    };

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify(payload)
        });

        // Check if the response is ok
        if (!response.ok) {
            console.error('Failed to update timeOfLastReservation', response);
        }

    } catch (error) {
        console.error('Error updating entity:', error);
    }

    // enimerosi xriston
    await updateMqtt(markerId, time, req.sessionID, city);
});

export default router;