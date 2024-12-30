function setupMQTT(sessionId, city) {
    const client = mqtt.connect('ws://150.140.186.118:9001');

    client.on('connect', () => {
        client.subscribe(sessionId)
        client.subscribe(sessionId + 'Reservation' + city)

    });

    client.on('message', (topic, message) => {
        if (topic == sessionId) {
            handleUpdateParkingSpot(message)
        }
        else if (topic == (sessionId + 'Reservation' + city)) {
            message = JSON.parse(message.toString())

            const markerId = message.markerId
            const timeOfLastReservation = message.reservationTime
            const markerEl = markers.find(el => el.id === markerId)
            const marker = markerEl.marker

            markerEl.timeOfLastReservation = timeOfLastReservation

            markerCluster.removeMarker(marker)

            if (selectedMarkerId == markerId) {
                closeInfoWindow()
            }
        }
    });
}