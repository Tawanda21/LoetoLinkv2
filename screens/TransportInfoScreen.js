import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import StopListComponent from '../components/StopListComponent';
import { getDistance } from 'geolib'; // npm install geolib

const TransportInfoScreen = ({ route }) => {
  // These should be passed via navigation
  const {
    routeInfo,           // { name, color }
    filteredRouteWaypoints, // Use the filtered stops, like in MapViewScreen
    userLocation,        // { latitude, longitude }
    totalDuration,       // e.g. "30 min"
    eta,                 // e.g. "08:15"
    delays,              // e.g. { summary: "5 min delay at Mainstation" }
  } = route?.params || {};

  // Fallback to routeWaypoints if filteredRouteWaypoints is not provided
  const stops = filteredRouteWaypoints || route.params?.routeWaypoints || [];

  // Add distance to each stop if userLocation is available
  const waypointsWithDistance = stops.map(stop => ({
    ...stop,
    distance: userLocation
      ? getDistance(
          { latitude: userLocation.latitude, longitude: userLocation.longitude },
          { latitude: stop.latitude, longitude: stop.longitude }
        )
      : null,
  }));

  return (
    <View style={styles.fullScreen}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <View style={styles.card}>
          {/* Show only the combi/route name */}
          <Text style={[styles.title, { color: routeInfo?.color || '#364c84' }]}>
            {routeInfo?.name || 'Combi Route'}
          </Text>
          {/* Show all stops below */}
          <StopListComponent
            routeWaypoints={waypointsWithDistance}
            showDetails
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
    backgroundColor: '#f5f6fa',
    flexGrow: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
});

export default TransportInfoScreen;