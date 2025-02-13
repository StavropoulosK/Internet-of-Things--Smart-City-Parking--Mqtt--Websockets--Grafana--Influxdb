import subprocess
import numpy as np
from PIL import Image

IMAGE_BOUNDS = {
    "N" : 38.25457,
    "S" : 38.23772,
    "E" : 21.74537,
    "W" : 21.72391,
    "width": 1000,
    "height": 1000,
}

def run_shadow_calculations():
    subprocess.run(["node", "src/simulation/shadows/shadows.mjs"], check=True)

def calculate_shadows(sensors):
    run_shadow_calculations()

    image = "src/simulation/shadows/shadow_data.png"
    img = Image.open(image)
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
            
        sensor.has_shadow = img_array[y, x][3] != 0

        for dy in range(-1, 2):
            for dx in range(-1, 2):
                val = [0, 255, 0, 255] if sensor.has_shadow else [255, 0, 0, 255]
                img_array[y + dy, x + dx] = (img_array[y + dy, x + dx] + val) / 2
    
    for y in range(IMAGE_BOUNDS['height']):
        for x in range(IMAGE_BOUNDS['width']):
            if img_array[y, x][3] == 0:
                img_array[y, x] = [255, 255, 255, 255]
    
    img = Image.fromarray(img_array)
    img.save("src/simulation/shadows/shadow_visualization.png")