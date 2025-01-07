async function sendNotificationParamsToServer(city){
    fetch('/mqtt/createNotification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ city:city })
    });
}

async function showAlive() {
    try {
        const response = await fetch('/showAlive'); // Make the GET request
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

    } catch (error) {
        console.error("Error pinging:", error); // Handle any errors
    }
}

async function getSessionId() {
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

export {sendNotificationParamsToServer, showAlive, getSessionId };