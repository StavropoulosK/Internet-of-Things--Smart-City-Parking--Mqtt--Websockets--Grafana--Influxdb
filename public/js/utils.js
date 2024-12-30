export async function fetchKey() {
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

export async function getSessionId() {
    try {
        const response = await fetch('/getSession');
        if (response.ok) {
            const sessionId = await response.json();

            return sessionId; 
        } else {
            console.error('Session not found');
        }
    } catch (error) {
        console.error('Error fetching session:', error);
    }
}

export async function getCurrentPosition() {
    if (!navigator.geolocation) {
        throw new Error("Geolocation not supported.");
    }
    return navigator.geolocation.getCurrentPosition(
        (position) => {
            console.log("Got location", position);
            return position;
        },
        (error) => {
            throw new Error("Error: Could not get your location.");
        }
    );
}

export async function getCityTemperature(){
    try {
        const response = await fetch('/getTemperature');
        if (response.ok) {
            cityTemperature = (await response.json()).temperature;
            return cityTemperature;
        } else {
            console.error('Error getting temperature');
        }
    } catch (error) {
        console.error('Error fetching session:', error);
    }
}