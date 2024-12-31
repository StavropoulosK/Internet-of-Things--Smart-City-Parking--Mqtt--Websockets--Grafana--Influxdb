// let AdvancedMarkerElement = googleMaps.AdvancedMarkerElement;
// let PinElement = googleMaps.PinElement;

async function displayMarkers(map) {
    getParkingSpotData().forEach(parkingSpot => {

    });
}

async function getParkingSpotData() {
    try {
        const response = await fetch('/api/data');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const parkingSpotData = await response.json();
        return parkingSpotData;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function createMarker(parkingSpot) {
    // Parkometro 2 wrwn
    const orangeThreshold = 10;

    const id = markerData.id
    const lat = markerData.coordinates[0]
    const lng = markerData.coordinates[1]
    const carParked = markerData.carParked
    const time = markerData.time      // i ora pou parkare kapoios teleutea fora
    const temperature = (markerData.temperature).toFixed(1)
    let category = markerData.category

    if (category.contains("forDisabled")) {
        category = "forDisabled"
    } else {
        category = "normal"
    }
}

export async function test(){
    const { Map } = await google.maps.importLibrary("maps");
}