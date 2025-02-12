from utils import connect_to_db, get_sensor_ids, create_heatmap, create_html_map
import json
import time

connector = connect_to_db()
cursor = connector.cursor()

print("Connected to DB")

def get_average_occupancy_data(cursor):
    ids = get_sensor_ids()

    sensors = {}

    for id in ids:
        table = f"smartCityParking_Patras_smartCityParking_{id}_OnStreetParking"

        occupancy, location = None, None

        query = f"""
            SELECT recvTimeTs, attrValue
            FROM {table}
            WHERE attrName = 'carParked'
            AND recvTime >= NOW() - INTERVAL 3 DAY
        """
        try:
            cursor.execute(query)
            occupancy = cursor.fetchall()
        except Exception as e:
            print(f"Skipping sensor {id}: {e}")
            continue

        prev_timestamp = None
        prev_state = None
        total_mins = 0
        total_occupied = 0
        for (timestamp, value) in occupancy:
            timestamp = int(timestamp)
            if prev_timestamp:
                total_mins += timestamp - prev_timestamp
                if prev_state == "true":
                    total_occupied += timestamp - prev_timestamp

            prev_timestamp = timestamp
            prev_state = value
        
        # current_time = int(time.time_ns() // 1e6)
        # total_mins += current_time - prev_timestamp
        # if prev_timestamp and prev_state == "true":
        #     total_occupied += current_time - prev_timestamp
        
        avg_occ = total_occupied / total_mins if total_mins > 0 else 0
        print(f"Sensor {id} has average occupancy {avg_occ}")
    
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
            print(f"Skipping sensor {id}: {e}")
            continue

        if occupancy and location:
            lat, lon = json.loads(location[0][0])["coordinates"]
            sensors[id] = {
            "value": avg_occ,
            "lat": lat,
            "lon": lon
        }
    
    return sensors

sensors = get_average_occupancy_data(cursor)
print(len(sensors))

image_path = "./public/html/heatmaps/average-occupancy.png"

min_value, max_value = 0, 1
df, bounds, colorbar = create_heatmap(sensors, image_path, min_value, max_value, caption='Average Occupancy')

html_path = "./public/html/heatmaps/average-occupancy.html"
zoom_options = {
    "min_zoom": 16,
    "max_zoom": 20,
    "zoom_start": 17
}
create_html_map(df, bounds, colorbar, image_path, html_path, zoom_options)