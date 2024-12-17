import requests
import mysql.connector

db_config = {
    'host': '150.140.186.118',
    'port': 3306,
    'user': 'readonly_student',
    'password': 'iot_password',
    'database': 'default'
}


def delete_matching_tables(pattern):
   
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        cursor.execute(f"SHOW TABLES LIKE '{pattern}'")
        tables = cursor.fetchall()

        if not tables:
            print("No tables found matching the pattern.")
            return


        for (table_name,) in tables:
            cursor.execute(f"DROP TABLE `{table_name}`")
            print(f"Table {table_name} deleted successfully.")

        connection.commit()

    except mysql.connector.Error as err:
        print(f"Error: {err}")

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# Not enough priveleges
delete_matching_tables("SmartCityParking_SmartCityParking_%_OnStreetParking")
