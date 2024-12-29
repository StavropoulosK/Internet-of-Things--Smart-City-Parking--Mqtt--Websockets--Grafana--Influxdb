import numpy as np

class ParkingSensor:
    def __init__(self, sensor_id, location, voltage, temperature, has_shadow=False):
        self.id = sensor_id
        self.location = location
        self.voltage = voltage
        self.temperature = temperature
        
        self.has_shadow = has_shadow

        self.occupied = False
        
        
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
    