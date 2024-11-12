import express from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';


// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpPort = process.env.SERVERPORT || 8080; // HTTP port
const httpsPort = 443; // HTTPS port


app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// HTTPS options
const options = {
    key: fs.readFileSync('./certificates/key.pem'),
    cert: fs.readFileSync('./certificates/cert.pem')
};

function redirectToHttps(req, res, next) {
    if (!req.secure) {
        // παίρνουμε το "127.0.0.1" από το "127.0.0.1:3000"
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

app.get('/getMap', redirectToHttps, (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/map.html'));
}
)

app.get('/', redirectToHttps, sendFile)

https.createServer(options, app).listen(httpsPort, () => {
    console.log(`HTTPS server running at https://127.0.0.1:${httpsPort}`);
});

app.listen(httpPort, () => console.log(`HTTP server running at  http://127.0.0.1:${httpPort}/`));

import router from './routes/routes.mjs';
app.use(router);