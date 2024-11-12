import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function getDirections(origin, destination) {
    return await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
        params: {
            origin,
            destination,
            key: GOOGLE_MAPS_API_KEY,
        },
    });
};

export { getDirections };