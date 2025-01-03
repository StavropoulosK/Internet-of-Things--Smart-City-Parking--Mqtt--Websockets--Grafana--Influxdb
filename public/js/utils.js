async function fetchKey() {
    //kanei fetch to api key
    console.log("fetching key")
    try {
        const response = await fetch('/APIKEY');
        const key = await response.text(); // Parse response as text
        return key
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function getCity(location) {
    return "Patras";

    // Tried to automatically find the city name. 
    // Unfortunately, the Geocoder API returns Patra, not Patras...
    // And the whole system breaks...
    const geocoder = new google.maps.Geocoder();

    try {
        const response = await geocoder.geocode({ location: location , language : 'en'});
        if (response.results.length > 0) {
            // Loop through address components to find the city
            const addressComponents = response.results[0].address_components;
            for (const component of addressComponents) {
                if (component.types.includes("locality")) {
                    return component.long_name; // This is the city name
                }
            }
            return "City not found in address components.";
        } else {
            return "No results found.";
        }
    } catch (error) {
        console.error("Error fetching city:", error);
        return "Error fetching city.";
    }
}

export { fetchKey, getCity };