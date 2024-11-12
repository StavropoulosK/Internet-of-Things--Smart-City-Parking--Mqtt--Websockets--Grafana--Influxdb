import dotenv from 'dotenv';

dotenv.config({ path: './src/config/.env' });

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export { GOOGLE_MAPS_API_KEY };