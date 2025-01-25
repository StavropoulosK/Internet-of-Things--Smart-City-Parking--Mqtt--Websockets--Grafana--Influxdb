import mysql.connector
import requests

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

def create_heatmap(data, bounds, sigma, cutoff, iters, filename):
    min_lat, min_lon = bounds[0]
    max_lat, max_lon = bounds[1]
    
    import numpy as np
    from scipy.ndimage import gaussian_filter

    min_sensor_data = min(sensor["value"] for sensor in data.values()) * cutoff
    
    num_cols = 512  # choose resolution (number of pixels horizontally)
    num_rows = 512  # choose resolution (number of pixels vertically)

    def get_grid_idx(lat, lon):
        lat_idx = int((lat - min_lat) / (max_lat - min_lat) * num_rows)
        lon_idx = int((lon - min_lon) / (max_lon - min_lon) * num_cols)
        return lat_idx, lon_idx

    starting_spots = [(sensor["lat"], sensor["lon"], sensor["value"]) for sensor in data.values()]

    # Perform interpolation
    grid = np.zeros((num_rows, num_cols))
    grid[:] = 10

    for lat, lon, val in starting_spots:
        lat_idx, lon_idx = get_grid_idx(lat, lon)
        grid[lat_idx, lon_idx] = val

    mask = (grid == 10)

    for _ in range(iters):
        smoothed_grid = gaussian_filter(grid, sigma=sigma)
        grid[mask] = smoothed_grid[mask]

    import matplotlib.pyplot as plt
    import matplotlib.colors as mcolors

    cmap = plt.get_cmap('plasma')

    # rmeove values below cutoff_val
    small_values = grid < min_sensor_data
    grid[small_values] = min_sensor_data

    # Normalize the data to the range [0, 1]
    norm = mcolors.Normalize(vmin=np.nanmin(grid), vmax=np.nanmax(grid))

    # Apply the colormap to the normalized data
    colored_grid = cmap(norm(grid))

    colored_grid[..., 3] = np.where(grid == min_sensor_data, 0, colored_grid[..., 3])

    # Save the result as an image
    plt.imsave(filename, colored_grid, origin='lower')

    return min

def create_html_map(heatmap_filename, html_filename, bounds, avg_pos):
    import folium

    m = folium.Map(location=avg_pos, zoom_start=16, tiles="cartodbpositron")

    image_overlay = folium.raster_layers.ImageOverlay(
        name="Heatmap",
        image=heatmap_filename,
        bounds=bounds,
        opacity=0.5,
        interactive=True,
        cross_origin=False,
        zindex=1,
    )
    image_overlay.add_to(m)
    
    m.save(html_filename)       