import numpy as np

hot_spots = {
    "Plateia Georgiou": (38.246387, 21735002),
    "Plateia Olgas": (38.249199, 21.737507)
}

class ParkingSensor:
    def __init__(self, sensor_id, location, voltage, temperature, has_shadow=False):
        self.id = sensor_id
        self.location = location
        self.voltage = voltage
        self.temperature = temperature
        
        self.has_shadow = has_shadow

        self.occupied = False

        self.distance_to_hot_spot = min(haversine(self.location, hot_spots[hot_spot]) for hot_spot in hot_spots)
        
    def update_voltage(self, mean_voltage_drop, std_voltage):
        self.voltage =float(self.voltage- abs(np.random.normal(mean_voltage_drop, std_voltage)))
        self.voltage = max(0.0, self.voltage)
        
        
    def update_temp(self, mean_temp, std_temp):
        self.temperature = np.random.normal(mean_temp, std_temp)
        
    def update_parking_status(self, epipedo_aixmis):
        a=self.occupied
        if epipedo_aixmis == 2:
            probability_to_free_spot = 0.1
            probability_to_take_spot = 0.3
        elif epipedo_aixmis == 1:
            probability_to_free_spot = 0.15
            probability_to_take_spot = 0.25
        else:
            probability_to_free_spot = 0.2
            probability_to_take_spot = 0.2
        
        if self.occupied:
            if np.random.rand() < probability_to_free_spot:
                self.occupied = False
                return True
        else:
            if np.random.rand() < probability_to_take_spot:
                self.occupied = True
                return True

        return False


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