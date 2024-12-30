async function sendNotificationParamsToServer(){
    fetch('/createNotification', {
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

export {sendNotificationParamsToServer, showAlive};