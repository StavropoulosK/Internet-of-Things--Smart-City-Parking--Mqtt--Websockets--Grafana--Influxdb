import { getCity } from "../utils.js";

async function getParkingSpotData(city) {
    try {
        const response = await fetch('/api/data?city=' + city);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const parkingSpotData = await response.json();
        return parkingSpotData;

    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

function getMinutesFromDuration(duration) {
    const match = duration.match(/PT(\d+)H/); // Extract digits between "PT" and "H"
    return match ? parseInt(match[1], 10) * 60 : null; // Convert to integer and return
}

function willVacateSoon(timeOfLastReservation, maximumParkingDuration) {
    const soonVacateThreshold = 10; // minutes
    
    const now = new Date();
    const timeOfLastReservationDate = new Date(timeOfLastReservation);
    const minspassed = (now - timeOfLastReservationDate) / 1000 / 60 ; // Convert milliseconds to minutes
    return getMinutesFromDuration(maximumParkingDuration) - minspassed < soonVacateThreshold;
}

async function findBestParkingSpot(destination, radius) {
    const city = await getCity(destination);
    try {
        const response = await fetch(`/api/bestParkingSpot?city=${city}&destination=${destination.lat},${destination.lng}&radius=${radius}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const bestParkingSpot = await response.json();
        return bestParkingSpot;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

export { getParkingSpotData, willVacateSoon, findBestParkingSpot };