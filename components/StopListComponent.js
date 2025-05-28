import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import haversine from 'haversine-distance';

const AVERAGE_SPEED_KMH = 40;

const StopListComponent = ({ routeWaypoints }) => {
  if (!routeWaypoints || routeWaypoints.length === 0) {
    return <Text>No stops found.</Text>;
  }

  let cumulative = 0;
  const stopsWithETA = routeWaypoints.map((stop, idx, arr) => {
    let eta = 0;
    if (idx > 0) {
      const prev = arr[idx - 1];
      const distanceMeters = haversine(
        { latitude: parseFloat(prev.latitude), longitude: parseFloat(prev.longitude) },
        { latitude: parseFloat(stop.latitude), longitude: parseFloat(stop.longitude) }
      );
      const distanceKm = distanceMeters / 1000;
      eta = (distanceKm / AVERAGE_SPEED_KMH) * 60;
      cumulative += eta;
    }
    return { ...stop, eta, cumulativeEta: cumulative };
  });

  const renderItem = ({ item, index }) => (
    <View style={styles.stopItem}>
      <Text style={styles.stopName}>{item.name}</Text>
      {index > 0 && (
        <Text style={styles.stopETA}>
          ETA from previous: {item.eta.toFixed(1)} min | Total ETA: {item.cumulativeEta.toFixed(1)} min
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={stopsWithETA}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
    padding: 10,
  },
  stopItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stopName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  stopETA: {
    fontSize: 14,
    color: '#555',
  },
});

export default StopListComponent;