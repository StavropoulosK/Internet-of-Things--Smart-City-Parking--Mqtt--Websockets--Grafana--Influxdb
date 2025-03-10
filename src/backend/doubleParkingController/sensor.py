import numpy as np
import requests

import os
from dotenv import load_dotenv
from pathlib import Path

# path to .env file
script_dir = Path(__file__).resolve().parent
env_path = script_dir.parents[1] / '.env'

# Retrieve the TOM_TOM_API_KEY from the environment
load_dotenv(dotenv_path=env_path)
TOM_TOM_API_KEY = os.getenv('TOM_TOM_API_KEY')


hot_spots = {
    "Plateia Georgiou": (38.246387, 21735002),
    "Plateia Olgas": (38.249199, 21.737507)
}


class ParkingSensor:
    def __init__(self, sensor_id, location, voltage, temperature, has_shadow=False, occupied=False, time_since_occupied=None):
        self.id = sensor_id
        self.location = location
        self.voltage = voltage
        self.temperature = temperature
        
        self.has_shadow = has_shadow

        self.occupied = occupied
        self.time_since_occupied = time_since_occupied

        self.distance_to_hot_spot = min(haversine(self.location, hot_spots[hot_spot]) for hot_spot in hot_spots)
        
    def update_voltage(self, mean_voltage_drop, std_voltage):
        self.voltage =float(self.voltage- abs(np.random.normal(mean_voltage_drop, std_voltage)))
        self.voltage = max(0.0, self.voltage)
        
        
    def update_temp(self, mean_temp, std_temp, shade_factor = 1, solar_intensity = 20):
        # https://savvycalculator.com/pavement-temperature-calculator
        # Sensor temperature is T_air + ΔΤ_solar * ShadeFactor
        if self.has_shadow:
            shade_factor = min(shade_factor, 0.1)
        self.temperature = np.random.normal(mean_temp, std_temp) + shade_factor * solar_intensity

        # # Smooth temperature changes
        # decay = 0.2
        # self.temperature = self.temperature * decay + new_temp * (1 - decay)
        
    def update_parking_status(self, epipedo_aixmis, local_time):
        distances_to_hot_spots = [haversine(self.location, hot_spots[hot_spot]) for hot_spot in hot_spots]
        want_factor = 1 + np.exp(-250 / np.min(distances_to_hot_spots))

        if epipedo_aixmis == 2:
            T_50 = 100
            probability_to_take_spot = 0.15 + traffic_coefficient
        elif epipedo_aixmis == 1:
            T_50 = 90
            probability_to_take_spot = 0.125 + traffic_coefficient
        else:
            T_50 = 80
            probability_to_take_spot = 0.1 + traffic_coefficient
        
        probability_to_take_spot *= want_factor

        if self.occupied:
            time_parked = local_time - self.time_since_occupied
            mins = time_parked.total_seconds() / 60
            if np.random.rand() < probability_to_leave(mins, 120, T_50, 0.2):
                self.occupied = False
                self.time_since_occupied = None
                return True
        else:
            if np.random.rand() < probability_to_take_spot:
                self.occupied = True
                self.time_since_occupied = local_time
                return True

        return False


def probability_to_leave(t, T_max, T_50, k):
    if t < 20:
        return 0.1 / 20 * t
    if t > T_max:
        return 1
    return 1 / (1 + np.exp(-k * (t - T_50)))


def haversine(loc1, loc2):
    lat1, lon1 = loc1
    lat2, lon2 = loc2
    
    R = 6371000  # radius of Earth in meters
    phi_1 = np.radians(lat1)
    phi_2 = np.radians(lat2)

    delta_phi = np.radians(lat2 - lat1)
    delta_lambda = np.radians(lon2 - lon1)

    a = np.sin(delta_phi / 2.0) ** 2 + np.cos(phi_1) * np.cos(phi_2) * np.sin(delta_lambda / 2.0) ** 2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))

    meters = R * c  # output distance in meters
    return meters


def fetch_traffic_data_coefficient():
    # auksani tin pithanotita katalipsis mias thesis analoga me tin kinisi simfona me to tom tom api se antiprosopeutikous dromous.

    coords = [[38.248920151628404, 21.73648764324976],
              [38.2474529345053,21.736054535037074],
              [38.24699910410793,21.736713512444744]]

    # to result afora tin auksisi stin pithanotita na katalifthi mia thesi
    result=0
    counter=0

    for lat, lon in coords:
        
        url = (f"https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/20/json"
            f"?point={lat},{lon}&unit=KMPH&key={TOM_TOM_API_KEY}")

        try:
            response = requests.get(url)
            if response.status_code != 200:
                raise Exception(f"HTTP error! Status: {response.status_code}")
            
            data = response.json()
            flow_data = data.get("flowSegmentData", {})
            
            if not flow_data:
                print("Error: No flow segment data available")
                return False

            current_speed = flow_data.get("currentSpeed", 0)
            free_flow_speed = flow_data.get("freeFlowSpeed", 1)  # Avoid division by zero
            sintelestis_taxititas = current_speed / free_flow_speed

            if 0.2 <= sintelestis_taxititas <= 0.6:
                result += 0.05
                counter +=1
            elif sintelestis_taxititas < 0.2:
                result += 0.1
                counter +=1
            else:
                result += 0

        except Exception as error:
            print("Error fetching traffic data:", error)
            return False
    

    if counter==0:
        return 0
    else:
        return result/counter


traffic_coefficient = fetch_traffic_data_coefficient()


