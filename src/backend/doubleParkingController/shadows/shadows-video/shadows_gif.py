import subprocess
import numpy as np
from PIL import Image

IMAGE_BOUNDS = {
    # "N" : 38.25457,
    # "S" : 38.23772,
    # "E" : 21.74537,
    # "W" : 21.72391,
    "N": 38.24826221452171,
    "S": 38.24404922340121,
    "E": 21.737340688705448,
    "W": 21.731976270675663,
    "width": 1000,
    "height": 1000,
}
# North: 38.24826221452171, South: 38.24404922340121, East: 21.737340688705448, West: 21.731976270675663

def run_shadow_calculations():
    subprocess.run(["node", "src/simulation/shadows/shadows.mjs"], check=True)

def calculate_shadows(sensors, source_path=None, out_path=None):
    # run_shadow_calculations()

    if source_path is None:
        source_path = "src/simulation/shadows/shadow_data.png"
        
    img = Image.open(source_path)
    img_array = np.array(img)
    
    for sensor in sensors:
        lat, lng = sensor.location
        lat = round(lat, 5)
        lng = round(lng, 5)

        # Convert lat/lng to pixel coordinates
        x = int((lng - IMAGE_BOUNDS["W"]) / (IMAGE_BOUNDS["E"] - IMAGE_BOUNDS["W"]) * IMAGE_BOUNDS["width"])
        if IMAGE_BOUNDS["E"] < IMAGE_BOUNDS["W"]:
            x = IMAGE_BOUNDS["width"] - x

        y = int((lat - IMAGE_BOUNDS["S"]) / (IMAGE_BOUNDS["N"] - IMAGE_BOUNDS["S"]) * IMAGE_BOUNDS["height"])
        if IMAGE_BOUNDS["N"] > IMAGE_BOUNDS["S"]:
            y = IMAGE_BOUNDS["height"] - y

        if x < 0 or x >= IMAGE_BOUNDS["width"] or y < 0 or y >= IMAGE_BOUNDS["height"]:
            continue
            
        sensor.has_shadow = img_array[y, x][3] != 0

        for dy in range(-4, 5):
            for dx in range(-4, 5):
                try:
                    val = [0, 255, 0, 255] if sensor.has_shadow else [255, 0, 0, 255]
                    img_array[y + dy, x + dx] = (img_array[y + dy, x + dx] + val) / 2
                except IndexError:
                    pass
    
    for y in range(IMAGE_BOUNDS['height']):
        for x in range(IMAGE_BOUNDS['width']):
            if img_array[y, x][3] == 0:
                img_array[y, x] = [255, 255, 255, 255]
    
    img = Image.fromarray(img_array)
    if out_path is None:
        out_path = "src/simulation/shadows/shadow_visualization.png"
    img.save(out_path)


def load_data_from_context_broker():
    import requests
    limit = 999
    url = f"http://150.140.186.118:1026/v2/entities?idPattern=^smartCityParking_&limit={limit}"
    headers = headers = {
        "Accept": "application/json",
        "FIWARE-ServicePath": "/smartCityParking/Patras"
    };
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to load data from context broker, status code: {response.status_code}")
        return []
    
class Sensor:
    def __init__(self, location):
        self.location = location
        self.has_shadow = False
        
def init_sensors():
    context_broker_data = load_data_from_context_broker()
    
    sensors = []
    for sensor in context_broker_data:
        loc = sensor["location"]["value"]["coordinates"]
        sensors.append(Sensor(loc))

    return sensors

if __name__ == "__main__":
    sensors = init_sensors()
    import os
    for i, file in enumerate(os.listdir("src/simulation/shadows/shadows-video/data")):
        print(f"Processing file {file}")
        if not "(" in file:
            continue
        idx = file.split('(')[1]
        idx = idx.split(')')[0]
        idx = int(idx)
        calculate_shadows(sensors, "src/simulation/shadows/shadows-video/data/" + file, f"src/simulation/shadows/shadows-video/out/shadow_visualization_{idx}.png")