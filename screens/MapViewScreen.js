import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const taxiRanks = [
  {
    id: 'broadhurst',
    name: 'Broadhurst Taxi Rank',
    latitude: -24.6251926,
    longitude: 25.9368589,
  },
  {
    id: 'gamecity',
    name: 'Game City Taxi Rank',
    latitude: -24.6869378,
    longitude: 25.8770554,
  },
  {
    id: 'mainmall',
    name: 'Main Mall Taxi Rank',
    latitude: -24.6586851,
    longitude: 25.9021672,
  },
];

const MapViewScreen = () => {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -24.6586,
          longitude: 25.9086,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Central Marker */}
        <Marker
          coordinate={{ latitude: -24.6586, longitude: 25.9086 }}
          title="Gaborone Center"
          description="Start here"
        />

        {/* Taxi Rank Markers */}
        {taxiRanks.map((rank) => (
          <Marker
            key={rank.id}
            coordinate={{ latitude: rank.latitude, longitude: rank.longitude }}
            title={rank.name}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

export default MapViewScreen;