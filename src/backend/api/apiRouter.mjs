import express from 'express';
import { currentParkingSpotsData, findBestParkingSpot } from './parkingSpots.mjs';
import { currentWeatherData } from './weather.mjs';

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
    const bestParkingSpot = await findBestParkingSpot(city, destination, radius)
    res.json(bestParkingSpot)
});


export default apiRouter;