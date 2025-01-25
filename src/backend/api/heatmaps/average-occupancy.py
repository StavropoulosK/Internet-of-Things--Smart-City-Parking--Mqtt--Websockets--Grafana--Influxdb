from utils import connect_to_db, get_sensor_ids, create_heatmap, create_html_map
import json

connector = connect_to_db()
cursor = connector.cursor()

print("Connected to DB")

def get_average_occupancy_data(cursor):
    ids = get_sensor_ids()

    sensors = {}

    for id in ids:
        table = f"smartCityParking_Patras_smartCityParking_{id}_OnStreetParking"

        query = f"""
            SELECT AVG(CASE WHEN attrValue = 'True' THEN 1 ELSE 0 END) AS occupancy
            FROM {table}
            WHERE attrName = 'carParked'
            AND recvTime >= DATE_SUB(NOW(), INTERVAL 1 MONTH);
        """
        try:
            cursor.execute(query)
            occupancy = cursor.fetchall()
        except Exception as e:
            print(f"Error fetching occupancy for sensor {id}: {e}")
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

        if occupancy and location:
            lat, lon = json.loads(location[0][0])["coordinates"]
            sensors[id] = {
            "occupancy": float(occupancy[0][0]),
            "lat": float(lat),
            "lon": float(lon)
        }
    return sensors

#------------------------------------------------------
# Step 1: Load and Parse Data
#------------------------------------------------------
sensors = get_average_occupancy_data(cursor)

lats = [sensor["lat"] for sensor in sensors.values()]
lons = [sensor["lon"] for sensor in sensors.values()]

max_lat, max_lon = max(lats) + 0.001, max(lons) + 0.001
min_lat, min_lon = min(lats) - 0.001, min(lons) - 0.001

bounds = [(min_lat, min_lon), (max_lat, max_lon)]
avg_pos = [sum(lats) / len(lats), sum(lons) / len(lats)]

heatmap_filename = "average-occupancy.png"
create_heatmap(sensors, bounds, sigma=2, cutoff=0.9, iters=512, filename=heatmap_filename)
print("Heatmap created")

html_filename = "average-occupancy.html"
create_html_map(heatmap_filename, html_filename, bounds, avg_pos)
print("HTML map created")