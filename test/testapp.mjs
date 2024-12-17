import express from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpsPort = 443; // HTTPS port

const options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem')
};


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/simple_mqtt_page.html'));

})


https.createServer(options, app).listen(httpsPort, () => {
    console.log(`HTTPS server running at https://127.0.0.1:${httpsPort}`);
});