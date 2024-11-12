import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;


// Your secure API key
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Directions endpoint
app.get('/api/directions', async (req, res) => {
    console.log("api/directions")
    // const { origin, destination } = req.query;
    let origin = "Patras, Greece"
    let destination = "Athens, Greece"
    try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
            params: {
                origin,
                destination,
                key: GOOGLE_MAPS_API_KEY,
            },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching directions' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});