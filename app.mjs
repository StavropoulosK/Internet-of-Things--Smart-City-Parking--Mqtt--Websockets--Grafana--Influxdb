import express from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpPort = process.env.SERVERPORT || 8080; // HTTP port
const httpsPort = 443; // HTTPS port

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;


app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

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

https.createServer(options, app).listen(httpsPort, () => {
    console.log(`HTTPS server running at https://127.0.0.1:${httpsPort}`);
});

app.listen(httpPort, () => console.log(`HTTP server running at  http://127.0.0.1:${httpPort}/`));