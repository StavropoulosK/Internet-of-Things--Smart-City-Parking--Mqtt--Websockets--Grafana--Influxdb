import express from 'express';
import { currentParkingSpotsData, findBestParkingSpot } from './parkingSpots.mjs';
import { currentWeatherData } from './weather.mjs';
import  { updateMqtt } from '../mqttClient.mjs';

let apiRouter = express.Router();

apiRouter.get("/data", async (req, res) => {
    const city = req.query.city;
    const data = await currentParkingSpotsData(city)
    res.json(data)
});

apiRouter.get("/getTemperature", async (req, res) => {
    const city = req.query.city;
    const temperature = await currentWeatherData(city)
    res.json({temperature : temperature})
});

apiRouter.get("/bestParkingSpot", async (req, res) => {
    const city = req.query.city;
    const destination = req.query.destination;
    const radius = req.query.radius;
    const filters = JSON.parse(req.query.filters)
    const bestParkingSpot = await findBestParkingSpot(city, destination, radius, filters)
    res.json(bestParkingSpot)
});

apiRouter.post('/makeReservation', async (req, res) => {

    // otan ginetai kratisi enimeroni ton context broker kai tous xristes

    const city = req.query.city;

    console.log(req.body);

    const { time, parkingSpotId } = req.body;

    const entity_id = 'smartCityParking_' + parkingSpotId

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
    await updateMqtt(parkingSpotId, time, req.sessionID, city);
});

export default apiRouter;