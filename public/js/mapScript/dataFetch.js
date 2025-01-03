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

async function findBestParkingSpot(destination, radius, filters) {
    const city = await getCity(destination);
    try {
        const response = await fetch(`/api/bestParkingSpot?city=${city}&destination=${destination.lat},${destination.lng}&radius=${radius}&filters=${JSON.stringify(filters)}`);
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

async function sendReservation(city, parkingSpotId) {
    const isoDateString = new Date().toISOString();
    return;
    try{
        await fetch(`/api/makeReservation?city=${city}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ time: isoDateString, parkingSpotId: parkingSpotId })
        });
    } catch (error) {
        console.error('Error making reservation:', error);
    }
}

function getReservationTime(parkingSpotId = null) {
    const now = new Date(); // Get the current local time
    now.setMinutes(now.getMinutes() + 15); // Add 15 minutes to the current time

    // Extract hours and minutes
    const hours = now.getHours().toString().padStart(2, '0'); // Ensure 2-digit format
    const minutes = now.getMinutes().toString().padStart(2, '0'); // Ensure 2-digit format

    return `${hours}:${minutes}`; // Return time in "HH:MM" format
}

export { getParkingSpotData, willVacateSoon, findBestParkingSpot, sendReservation, getReservationTime };