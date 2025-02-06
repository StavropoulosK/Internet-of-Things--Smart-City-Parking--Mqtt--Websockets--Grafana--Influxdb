import numpy as np
import matplotlib.pyplot as plt

# Parameters
P_max = 0.9    # Max probability near hotspot
k = 0.1        # Decay rate (adjust for spread)
grid_size = (10, 10)  # Parking lot size (10x10 grid)
hotspots = [(2, 2), (7, 7)]  # Example hotspot locations
parking_spots = [(x, y) for x in range(grid_size[0]) for y in range(grid_size[1])]

def distance_to_nearest_hotspot(spot, hotspots):
    """Calculate the distance from a parking spot to the nearest hotspot."""
    return min(np.linalg.norm(np.array(spot) - np.array(hotspot)) for hotspot in hotspots)

def occupancy_probability(spot, hotspots, P_max=0.9, k=0.1):
    """Compute the probability of a parking spot being occupied based on distance to hotspots."""
    d = distance_to_nearest_hotspot(spot, hotspots)
    return P_max * np.exp(-k * d)

# Simulate occupancy
occupied_spots = [spot for spot in parking_spots if np.random.rand() < occupancy_probability(spot, hotspots)]

# Visualization
plt.figure(figsize=(6,6))
for x, y in parking_spots:
    color = 'red' if (x, y) in occupied_spots else 'green'
    plt.scatter(x, y, c=color, edgecolors='black', s=100)

# Plot hotspots
for hx, hy in hotspots:
    plt.scatter(hx, hy, c='blue', s=200, marker='X', label='Hotspot')

plt.xlabel("X Coordinate")
plt.ylabel("Y Coordinate")
plt.title("Simulated Parking Lot Occupancy")
plt.legend(["Occupied", "Available", "Hotspot"])
plt.grid()
plt.show()
