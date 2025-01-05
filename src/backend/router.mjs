import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'

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

// router.get('/getDashboards', (req, res) => {
//     res.sendFile(fileLocation + 'dashboards.html');
// })

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
router.get('/APIKEY', (req, res) => {
    res.send(GOOGLE_MAPS_API_KEY)
})

router.get('/getSession', (req, res) => {
    const sessionId = req.sessionID
    res.json(sessionId)
})

export default router;