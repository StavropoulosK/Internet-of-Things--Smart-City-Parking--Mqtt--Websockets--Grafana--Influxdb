import folium.raster_layers
from utils import connect_to_db, get_sensor_ids
import json
import pandas as pd
import geopandas as gpd

from shapely.geometry import Point

connector = connect_to_db()
cursor = connector.cursor()

print("Connected to DB")

def get_current_temperature_data(cursor):
    ids = get_sensor_ids()

    sensors = {}

    for id in ids:
        table = f"smartCityParking_Patras_smartCityParking_{id}_OnStreetParking"

        query = f"""
            SELECT attrValue AS temperature
            FROM {table}
            WHERE attrName = 'temperature'
            ORDER BY recvTimeTs DESC
            LIMIT 1;
        """
        try:
            cursor.execute(query)
            temperature = cursor.fetchall()
        except Exception as e:
            print(f"Error fetching temperature for sensor {id}: {e}")
            continue

        query = f"""
            SELECT attrValue AS location
            FROM {table}
            WHERE attrName = 'location'
            LIMIT 1;
        """
        try:
            cursor.execute(query)
            location = cursor.fetchall()
        except Exception as e:
            print(f"Error fetching location for sensor {id}: {e}")
            continue

        if temperature and location:
            lat, lon = json.loads(location[0][0])["coordinates"]
            sensors[id] = {
            "temperature": float(temperature[0][0]),
            "lat": float(lat),
            "lon": float(lon)
        }
    return sensors

#------------------------------------------------------
# Step 1: Load and Parse Data
#------------------------------------------------------
sensors = get_current_temperature_data(cursor)
print(len(sensors))
df = pd.DataFrame.from_dict(sensors, orient="index")

#------------------------------------------------------
# Step 2: Round Coordinates to 4 Decimal Places (Tiling)
#------------------------------------------------------
df['lat_tile'] = df['lat'].round(5)
df['lon_tile'] = df['lon'].round(5)

# Group by these tile coordinates and average the values
grouped = df.groupby(['lat_tile', 'lon_tile'], as_index=False).agg({'temperature': 'mean'})

#------------------------------------------------------
# Step 3: Create a GeoDataFrame of the Averaged Points
#------------------------------------------------------
geometry = [Point(xy) for xy in zip(grouped['lon_tile'], grouped['lat_tile'])]
gdf = gpd.GeoDataFrame(grouped, geometry=geometry)
gdf.set_crs(epsg=4326, inplace=True)  # WGS84

#------------------------------------------------------
# Step 4: Interpolate to Create a Continuous Scalar Field (Raster)
#------------------------------------------------------
import numpy as np
from scipy.interpolate import griddata
import folium

# Extract coordinates and values
points = np.array(list(zip(gdf['lon_tile'], gdf['lat_tile'])))
values = gdf['temperature'].values

# Define a grid over the area of interest
min_lon, min_lat, max_lon, max_lat = gdf.total_bounds
num_cols = 1000  # choose resolution (number of pixels horizontally)
num_rows = 1000  # choose resolution (number of pixels vertically)

lon_lin = np.linspace(min_lon, max_lon, num_cols)
lat_lin = np.linspace(min_lat, max_lat, num_rows)
lon_grid, lat_grid = np.meshgrid(lon_lin, lat_lin)

# Perform interpolation
grid = griddata(points, values, (lon_grid, lat_grid), method="cubic")

import matplotlib.pyplot as plt
import matplotlib.colors as mcolors

cmap = plt.get_cmap('viridis')

# Normalize the data to the range [0, 1]
norm = mcolors.Normalize(vmin=np.nanmin(grid), vmax=np.nanmax(grid))

# Apply the colormap to the normalized data
filtered_grid = np.where(np.isnan(grid), np.nanmin(grid), grid)
colored_grid = cmap(norm(filtered_grid))

# Set NaN values to be fully transparent
colored_grid[..., 3] = np.where(np.isnan(grid), 0, colored_grid[..., 3])

# Save the result as an image
plt.imsave('heatmap.png', colored_grid, origin='lower')

# Define the bounds of the image
bounds = [[min_lat, min_lon], [max_lat, max_lon]]

# Create a folium map centered around the average coordinates
m = folium.Map(location=[df['lat'].mean(), df['lon'].mean()], zoom_start=16, tiles='Cartodb Positron')

# Overlay the image onto the map
image_overlay = folium.raster_layers.ImageOverlay(
    image='heatmap.png',
    bounds=bounds,
    opacity=0.6,
    interactive=True,
    cross_origin=False,
    zindex=1,
)

image_overlay.add_to(m)

# Save the map to an HTML file
m.save('heatmap_map.html')

