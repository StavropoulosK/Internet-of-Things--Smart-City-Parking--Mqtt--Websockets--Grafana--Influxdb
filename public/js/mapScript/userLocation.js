

let userLocation = null;
let userLocationMarker = null;

function createUserPin() {
    const blueDotElement = document.createElement("div");
    blueDotElement.style.width = "12px"; // Set the diameter of the dot
    blueDotElement.style.height = "12px";
    blueDotElement.style.backgroundColor = "#4285F4"; // Blue color
    blueDotElement.style.borderRadius = "50%"; // Make it a circle
    blueDotElement.style.border = "2px solid white"; // Optional: Add a white border
    blueDotElement.style.boxShadow = "0 0 5px rgba(0, 0, 0, 0.8)"; // Optional: Add shadow for better visibility
    return blueDotElement
}

function updateUserLocationPin(map, location) {
    // Remove previous marker if any
    clearUserLocationPin();

    userLocationMarker = new AdvancedMarkerElement({
        position: location,
        map: map,
        content: createUserPin(),
    });
}