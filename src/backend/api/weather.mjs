const cityToCoords = {
    "Patras": [38.246403475045675, 21.731728987305722],
}

async function currentWeatherData(city) {

    if (!cityToCoords[city]) {
        console.error("No weather data for this city:", city);
        return;
    }
    const [lat, lng] = cityToCoords[city];
    
    const apiUrl = `https://api.open-meteo.com/v1/forecast`;
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lng,
        current_weather: true,
    });
    try {
        const response = await fetch(`${apiUrl}?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.current_weather) {
            const currentTemperature2m = data.current_weather.temperature;
            return currentTemperature2m;
        } else {
            console.error("No current weather data found in response!");
        }

    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
}

export { currentWeatherData };