import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import StopListComponent from '../components/StopListComponent';
import { getDistance } from 'geolib';

const TransportInfoScreen = ({ route }) => {
  const {
    routeInfo,
    filteredRouteWaypoints,
    userLocation,
  } = route?.params || {};

  const stops = filteredRouteWaypoints || route.params?.routeWaypoints || [];

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
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f6fa' }} contentContainerStyle={{ padding: 16 }}>
      <View style={{
        backgroundColor: 'white',
        padding: 22,
        borderRadius: 24,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 12,
        marginTop: 20,
      }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
          Route Stops
        </Text>
        {routeInfo?.name && (
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#018abe', marginBottom: 10 }}>
            Riding: {routeInfo.name}
          </Text>
        )}
        <StopListComponent routeWaypoints={waypointsWithDistance} />
      </View>
    </ScrollView>
  );
};

export default TransportInfoScreen;