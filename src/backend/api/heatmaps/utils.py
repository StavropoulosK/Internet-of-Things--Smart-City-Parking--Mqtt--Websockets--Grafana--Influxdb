import mysql.connector
import requests

import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
import folium.raster_layers
import numpy as np
from scipy.interpolate import griddata
import folium

import matplotlib.pyplot as plt
import matplotlib.colors as mcolors

db_config = {
    "host": "150.140.186.118",
    "port": 3306,
    "user": "readonly_student",
    "password": "iot_password",
    "database": "default",
}


def connect_to_db():
    return mysql.connector.connect(**db_config)


def get_sensor_ids():
    url = "https://patra.smartiscity.gr/api/api.php?func=parkingAll"

    try:
        response = requests.get(url)
        if response.status_code != 200:
            print("Error: ", response.status_code)
            return None

        data = response.json()

        locations = [parking["id"] for parking in data]

    except Exception as e:
        print(e)
        return None

    return locations

def create_heatmap(sensor_data, image_path, min_value, max_value, fill_value=0, caption='Sensor Values'):
    df = pd.DataFrame.from_dict(sensor_data, orient="index")

    grid, bounds = interpolate_data(df)
    # grid, bounds = my_interpolation(df, sensor_data)

    cmap = plt.get_cmap('plasma')

    # Normalize the data to the range [0, 1]
    norm = mcolors.Normalize(vmin=min_value, vmax=max_value)

    fill_value = np.nanmean(grid)
    filtered_grid = np.where(np.isnan(grid), fill_value, grid)
    colored_grid = cmap(norm(filtered_grid))

    # Save the result as an image
    plt.imsave(image_path, colored_grid, origin='lower')
    
    # create a colorbar to later use in the map
    colorbar = create_color_bar(cmap, min_value, max_value, caption)

    return df, bounds, colorbar
    
    
def interpolate_data(df, num_cols=3000, num_rows=3000):
    df['lat_tile'] = df['lat'].round(5)
    df['lon_tile'] = df['lon'].round(5)

    # Group by these tile coordinates and average the values
    grouped = df.groupby(['lat_tile', 'lon_tile'], as_index=False).agg({'value': 'mean'})

    geometry = [Point(xy) for xy in zip(grouped['lon_tile'], grouped['lat_tile'])]
    gdf = gpd.GeoDataFrame(grouped, geometry=geometry)
    gdf.set_crs(epsg=4326, inplace=True)  # WGS84

    # Extract coordinates and values
    points = np.array(list(zip(gdf['lon_tile'], gdf['lat_tile'])))
    values = gdf['value'].values

    # Define a grid over the area of interest
    min_lon, min_lat, max_lon, max_lat = gdf.total_bounds
    #increase the bounds a bit
    min_lon -= 0.001
    min_lat -= 0.001
    max_lon += 0.001
    max_lat += 0.001

    num_cols = 3000  # choose resolution (number of pixels horizontally)
    num_rows = 3000  # choose resolution (number of pixels vertically)

    lon_lin = np.linspace(min_lon, max_lon, num_cols)
    lat_lin = np.linspace(min_lat, max_lat, num_rows)
    lon_grid, lat_grid = np.meshgrid(lon_lin, lat_lin)

    # Perform interpolation
    grid = griddata(points, values, (lon_grid, lat_grid), method="linear")
    bounds = [[min_lat, min_lon], [max_lat, max_lon]]
    
    return grid, bounds


def create_html_map(df, bounds, colorbar, image_path, output_path, zoom_options):
    # Create a folium map centered around the average coordinates
    bound_options = {
        "max_bounds": True,
        "min_lat": bounds[0][0],
        "min_lon": bounds[0][1],
        "max_lat": bounds[1][0],
        "max_lon": bounds[1][1],
    }

    m = folium.Map(location=[df['lat'].mean(), df['lon'].mean()], tiles='cartodbpositron', **zoom_options, **bound_options)
    
    # Overlay the image onto the map
    image_overlay = folium.raster_layers.ImageOverlay(
        image=image_path,
        bounds=bounds,
        opacity=0.6,
        interactive=True,
        cross_origin=False,
        zindex=1,
    )
    image_overlay.add_to(m)

    colorbar.add_to(m)

    # Save the map to an HTML file
    m.save(output_path)

def create_color_bar(cmap, min_value, max_value, caption='Sensor Values'):
    
    import branca.colormap as cm

    colorbar = cm.LinearColormap(
        colors=[cmap(i) for i in range(cmap.N)],
        vmin=min_value,
        vmax=max_value
    )
    colorbar.caption = caption
    colorbar.tick_labels = [min_value, (min_value + max_value) / 4, (min_value + max_value) / 2, (min_value + max_value) * 3 / 4, max_value]
    colorbar.width = 300

    return colorbar

def my_interpolation(df, sensor_data):
    min_lon = df['lon'].min() - 0.001
    min_lat = df['lat'].min() - 0.001
    max_lon = df['lon'].max() + 0.001
    max_lat = df['lat'].max() + 0.001
    
    num_cols = 256
    num_rows = 256

    grid = np.zeros((num_rows, num_cols))

    def convert_to_grid(lat, lon):
        x = int((lon - min_lon) / (max_lon - min_lon) * num_cols)
        y = int((lat - min_lat) / (max_lat - min_lat) * num_rows)
        return x, y

    sensor_list = [sensor_data[sensor] for sensor in sensor_data]
    sensor_idxs = [(convert_to_grid(sensor['lat'], sensor['lon']), sensor['value']) for sensor in sensor_list]

    for (x, y), value in sensor_idxs:
        grid[y, x] = value
        # print(value)
    
    top = 5
    for x in range(num_cols):
        for y in range(num_rows):
            if grid[y, x] != 0:
                continue
            distances = []
            for (x2, y2), value in sensor_idxs:
                if x2 == x and y2 == y:
                    distances.append((1, value))
                    continue
                distances.append((np.sqrt((x - x2) ** 2 + (y - y2) ** 2), value))
            distances.sort(key=lambda x: x[0])

            if distances[0][0] > 50:
                continue
                
            sum_weighted_values = sum(float(value) / distance for distance, value in distances[:top])
            sum_weights = sum(1 / distance for distance, _ in distances[:top])
            grid[y, x] = sum_weighted_values / sum_weights

        print(x)
    
    return grid, [[min_lat, min_lon], [max_lat, max_lon]]