import express from 'express';
import { currentParkingSpotsData } from './parkingSpots.mjs';
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


export default apiRouter;