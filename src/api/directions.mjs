import axios from 'axios';

import { GOOGLE_MAPS_API_KEY } from '../config/config.mjs';

async function getDirections(origin, destination) {
    try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
            params: {
                origin,
                destination,
                key: GOOGLE_MAPS_API_KEY,
            },
        });

        if (response.data.status !== 'OK') {
            console.error('Google Maps API error:', response.data.error_message || response.data.status);
            return null;
        }
        return response;

    } catch (error) {
        if (error.response) {
            console.error('API responded with an error:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('No response received from API:', error.request);
        } else {
            console.error('Error setting up API request:', error.message);
        }
        return null;
    }
    
};

export { getDirections };