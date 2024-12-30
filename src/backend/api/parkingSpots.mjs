async function currentParkingSpotsData(city) {

    const url = `http://150.140.186.118:1026/v2/entities?idPattern=^smartCityParking_&limit=999`;

    const headers = {
        "Accept": "application/json",
        "FIWARE-ServicePath": `/smartCityParking/${city}`
    };
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
                maximumParkingDuration: maximumParkingDuration
            })
        }
        return data

    } catch (error) {
        console.error(error.message);
    }
}

export { currentParkingSpotsData };