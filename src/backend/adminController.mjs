import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileLocation = path.join(__dirname, '../../public/html/');

// Check if the user is logged in as an admin
function isAdmin(req, res, next) {
    if (req.session.isAdmin) {
        next();
    } else {
        res.status(403).send('Access denied. You must be logged in as an admin.');
    }
}

const adminCredentials = {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD
};

let adminRouter = express.Router();

adminRouter.get('/login', (req, res) => {
    res.sendFile(fileLocation + 'adminLogin.html');
});

adminRouter.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === adminCredentials.username && password === adminCredentials.password) {
        req.session.isAdmin = true;
        res.status(200).send('Successfully logged in');
    } else {
        res.status(401).send('Invalid username or password');
    }
});

adminRouter.get('/logout', (req, res) => {
    req.session.isAdmin = false;
    res.redirect('/');
});

adminRouter.get('/is-logged-in', (req, res) => {
    res.json({ loggedIn: req.session.isAdmin });
});

adminRouter.get('/getDashboards', isAdmin, (req, res) => {
    res.sendFile(fileLocation + 'dashboards.html')
});

export { isAdmin, adminRouter };