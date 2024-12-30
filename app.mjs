import express from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import session from "express-session";



// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpPort = process.env.SERVERPORT || 8080; // HTTP port
const httpsPort = 443; // HTTPS port


app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use(express.json())


app.use(session({
    name: 'cookieSid',
    secret: process.env.SESSION_SECRET, // κλειδί για κρυπτογράφηση του cookie
    resave: false, // δεν χρειάζεται να αποθηκεύεται αν δεν αλλάξει
    saveUninitialized: true, //  αποθήκευση session id για κάθε client
    rolling: true,
    cookie: {
        secure: false,         // TRUE AN einai i sindesh httpS
        sameSite: true,
        httpOnly: true,
        maxAge: 15 * 60 * 1000    // 15 min
    }
}));


// HTTPS options
const options = {
    key: fs.readFileSync('./certificates/key.pem'),
    cert: fs.readFileSync('./certificates/cert.pem')
};

function redirectToHttps(req, res, next) {
    next()
    return
    if (!req.secure) {
        const location = req.headers.host;
        const domain = location.slice(0, location.indexOf(':'));
        const secureUrl = 'https://' + domain + ':' + httpsPort + req.url;
        return res.redirect(secureUrl);
    }
    next()
}

app.use(redirectToHttps)


import router from "./src/backend/router.mjs";
app.use('/', router);

import apiRouter from "./src/backend/api/apiRouter.mjs";
app.use('/api', apiRouter);

import { mqttRouter } from "./src/backend/mqttClient.mjs";
app.use('/mqtt', mqttRouter);

// function convertUtcTimeToLocalTime(utcTime) {
//     // metatrepi to utc time se ora elados

//     const date = new Date(utcTime); // Parse the UTC date string

//     // Get individual components of the local time
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
//     const day = String(date.getDate()).padStart(2, '0');
//     const hours = String(date.getHours()).padStart(2, '0');
//     const minutes = String(date.getMinutes()).padStart(2, '0');
//     const seconds = String(date.getSeconds()).padStart(2, '0');
//     const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

//     const localTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
//     return localTime;
// }



app.listen(httpPort, () => console.log(`HTTP server running at  http://127.0.0.1:${httpPort}/`));

// https.createServer(options, app).listen(httpsPort, () => {
//     console.log(`HTTPS server running at https://127.0.0.1:${httpsPort}`);
// });