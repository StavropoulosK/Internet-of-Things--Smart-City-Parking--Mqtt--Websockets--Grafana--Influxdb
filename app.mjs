import express from 'express';
import fs from 'fs';
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

app.use(express.urlencoded({ extended: true })); // required for admin login post request


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

// router gia tin efarmogi
import router from "./src/backend/router.mjs";
app.use('/', router);

// router gia to api
import apiRouter from "./src/backend/api/apiRouter.mjs";
app.use('/api', apiRouter);

// router gia ta active sessions kai ta sesssion Ids
import { mqttRouter } from "./src/backend/mqttClient.mjs";
app.use('/mqtt', mqttRouter);

import { adminRouter } from './src/backend/adminController.mjs';
app.use('/admin', adminRouter);

import { setupMQTTClient } from './src/backend/mqttClient.mjs';
await setupMQTTClient();


app.listen(httpPort, () => console.log(`HTTP server running at  http://127.0.0.1:${httpPort}/`));

// https.createServer(options, app).listen(httpsPort, () => {
//     console.log(`HTTPS server running at https://127.0.0.1:${httpsPort}`);
// });


// Update the heatmaps
import { update_current_temp_heatmap,update_average_temp_heatmap, update_average_occupancy_heatmap} from "./src/backend/api/heatmaps/update_heatmaps.mjs"

update_current_temp_heatmap();
update_average_temp_heatmap();
update_average_occupancy_heatmap();

setInterval(update_current_temp_heatmap, 1000 * 60 * 10); // Update every 10 minutes
setInterval(update_average_temp_heatmap, 1000 * 60 * 60 * 24); // Update every 24 hours
setInterval(update_average_occupancy_heatmap, 1000 * 60 * 60 * 24); // Update every 24 hours