import { currentWeatherData }  from "./weather.mjs";

let parkingSpotData = {};

async function currentParkingSpotsData(city) {
    const url = `http://150.140.186.118:1026/v2/entities?idPattern=^smartCityParking_&limit=999`;

    const headers = {
        "Accept": "application/json",
        "FIWARE-ServicePath": `/smartCityParking/${city}`
    };
    const cityTemperature = await currentWeatherData(city);

    const data = []

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const entities = await response.json();

        for (const sensorData of entities) {
            const location = sensorData.location?.value?.coordinates;
            const carParked = sensorData.carParked?.value;
            const category = sensorData.category?.value
            const temperature = sensorData?.temperature?.value
            const id = (sensorData.id).split('_').pop();
            const utcTime = sensorData.occcupancyModified?.value

            const timeOfLastReservation = sensorData.timeOfLastReservation.value
            const maximumParkingDuration = sensorData.maximumParkingDuration.value

            data.push({
                coordinates: location,
                category: category,
                temperature: temperature,
                carParked: carParked,
                id: id,
                time: utcTime,
                timeOfLastReservation: timeOfLastReservation,
                maximumParkingDuration: maximumParkingDuration,
                hasShadow: parkingSpotHasShadow(cityTemperature, temperature)
            })
        }
        parkingSpotData[city] = data;
        return data;

    } catch (error) {
        console.error(error.message);
    }
}

async function singParkingSpotData(city, parkingSpotId) {
    const url = `http://150.140.186.118:1026/v2/entities?idPattern=^smartCityParking_${parkingSpotId}`;

    const headers = {
        "Accept": "application/json",
        "FIWARE-ServicePath": `/smartCityParking/${city}`
    };

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const entities = await response.json();

        const sensorData = entities[0];

        if (!sensorData) {
            return;
        }

        return {
            coordinates: sensorData.location?.value?.coordinates,
            category: sensorData.category?.value,
            temperature: sensorData?.temperature?.value,
            carParked: sensorData.carParked?.value,
            id: (sensorData.id).split('_').pop(),
            time: sensorData.occcupancyModified?.value,

            timeOfLastReservation: sensorData.timeOfLastReservation.value,
            maximumParkingDuration: sensorData.maximumParkingDuration.value
        }

    } catch (error) {
        console.error(error.message);
    }
    
}

async function findBestParkingSpot(city, destination, radius, filters) {
    const parkignSpotData = await currentParkingSpotsData(city);

    const [ destLat, destLng ] = destination.split(',').map(parseFloat);
    // filter parking spots that are within the radius using havarsine and fullfill the filters
    let filteredParkingSpotData = parkignSpotData.filter(parkingSpot => {
        const distance = haversine(parkingSpot.coordinates[0], parkingSpot.coordinates[1], destLat, destLng);
        if (!filters.forAmEA && parkingSpot.category.includes("forDisabled")) {
            return false;
        } else if (filters.withShadow && !parkingSpot.hasShadow) {
            return false;
        } else if (filters.onlyFree && parkingSpot.carParked) {
            return false;
        }
        return distance <= radius;
    });

    // rank the remaining parking spots, lower score is better
    filteredParkingSpotData = filteredParkingSpotData.sort((a, b) => rankParkingSpots(b, destination) - rankParkingSpots(a, destination));

    // return the best parking spot
    return filteredParkingSpotData[0];
}

function parkingSpotHasShadow(cityTemp, parkignSpotTemp) {
    return parkignSpotTemp < cityTemp - 2;
}

function rankParkingSpots(parkingSpot, destination) {
    // simple ranking, based on distance from destination
    return haversine(parkingSpot.coordinates[0], parkingSpot.coordinates[1], destination.lat, destination.lng);
}

function haversine(lat1, lng1, lat2, lng2) {
    // Gia ton ipologismo tis apostasis dio theseon mporei na xrisimopoiithi i methodos haversine.
    //https://www.geeksforgeeks.org/haversine-formula-to-find-distance-between-two-points-on-a-sphere/
    // console.log(lat1, lng1, lat2, lng2);
    // distance between latitudes
    // and longitudes
    let dLat = (lat2 - lat1) * Math.PI / 180.0;
    let dLon = (lng2 - lng1) * Math.PI / 180.0;

    // convert to radiansa
    lat1 = (lat1) * Math.PI / 180.0;
    lat2 = (lat2) * Math.PI / 180.0;

    // apply formulae
    let a = Math.pow(Math.sin(dLat / 2), 2) +
        Math.pow(Math.sin(dLon / 2), 2) *
        Math.cos(lat1) *
        Math.cos(lat2);
    let rad = 6371;
    let c = 2 * Math.asin(Math.sqrt(a));

    // to apotelesma einai se metra
    return rad * c * 1000;
}

export { currentParkingSpotsData, singParkingSpotData, findBestParkingSpot, parkingSpotHasShadow };