import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import StopListComponent from '../components/StopListComponent';
import { getDistance } from 'geolib'; // npm install geolib

const TransportInfoScreen = ({ route }) => {
  // These should be passed via navigation
  const {
    routeInfo,           // { name, color }
    routeWaypoints,      // [{ name, time, eta, delay, platform, latitude, longitude }]
    userLocation,        // { latitude, longitude }
    totalDuration,       // e.g. "30 min"
    eta,                 // e.g. "08:15"
    delays,              // e.g. { summary: "5 min delay at Mainstation" }
  } = route?.params || {};

  // Add distance to each stop if userLocation is available
  const waypointsWithDistance = routeWaypoints?.map(stop => ({
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
          <Text style={[styles.title, { color: routeInfo?.color || '#364c84' }]}>
            {routeInfo?.name || 'Your Trip'}
          </Text>
          <Text style={styles.subtitle}>
            ETA: {eta || '--:--'} | Total: {totalDuration || '--'} 
          </Text>
          {delays?.summary && (
            <Text style={styles.delayText}>Delays: {delays.summary}</Text>
          )}
          <StopListComponent
            routeWaypoints={waypointsWithDistance}
            showDetails // You can use this prop to show extra info in StopListComponent
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
  subtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 8,
  },
  delayText: {
    fontSize: 15,
    color: '#d32f2f',
    marginBottom: 12,
    fontWeight: 'bold',
  },
});

export default TransportInfoScreen;