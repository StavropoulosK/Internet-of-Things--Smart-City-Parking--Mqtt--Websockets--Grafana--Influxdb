# Smart City Parking

This project is the creation of the students Stavropoulos Constantinos and Hlias Ouzounis of the Department of Electrical Engineering and Computer Technology of the University of Patras for the Internet of Things course for the academic year 2024-2025.

## Google Maps API Keys

### API Key

Initially, it is required to create an API key from google.

### Map Id

Moreover, it is necessary to create a map id from google. You can create the map id from Map Management Menu and afterwards you can apply a style.

![Map Id](./Presentations/images/map-id.png)

### Navigation

The application detects the current location during navigation and displays the route. To achieve this, it uses the browser's navigator.geolocation API. This API automatically determines the position based on GPS if available or the IP address with less accuracy if GPS is unavailable.

To run the simulation, the following programs must be running simultaneously: Iot_Agent.py, simulate.py, Influx Agent, and the server.

### Smart Data Models

The data format was derived from  [smart Data Models](https://github.com/smart-data-models/dataModel.Parking/blob/master/OnStreetParking/doc/spec.md)
for onstreet parking

