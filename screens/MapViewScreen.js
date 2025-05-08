import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const MapViewScreen = ({ route }) => {
  const { origin, destination } = route.params || {}; // Fallback to undefined if params are missing

  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    if (origin && destination) {
      const fetchRoute = async () => {
        try {
          const directionsUrl = `https://maps.gomaps.pro/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=AlzaSykD0-TOgCvku5D5nyYC67DmWk2aaon-COn`;
          const response = await fetch(directionsUrl);
          const directionsData = await response.json();

          if (directionsData.status === 'OK') {
            const points = decodePolyline(directionsData.routes[0].overview_polyline.points);
            setRouteCoordinates(points);
          } else {
            console.error('Failed to fetch directions:', directionsData.status);
          }
        } catch (error) {
          console.error('Error fetching route:', error);
        }
      };

      fetchRoute();
    }
  }, [origin, destination]);

  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return points;
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: origin?.latitude || -24.6586, // Default latitude if origin is missing
          longitude: origin?.longitude || 25.9086, // Default longitude if origin is missing
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Render markers if origin and destination are provided */}
        {origin && <Marker coordinate={origin} title="Origin" />}
        {destination && <Marker coordinate={destination} title="Destination" />}

        {/* Render the route if coordinates are available */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#0000FF"
            strokeWidth={3}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
});

export default MapViewScreen;