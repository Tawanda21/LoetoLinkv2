import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const formatDistance = (meters) => {
  if (meters == null) return '';
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const StopListComponent = ({ routeWaypoints }) => {
  if (!routeWaypoints || routeWaypoints.length === 0) {
    return <Text style={{ textAlign: 'center', color: '#888' }}>No stops available.</Text>;
  }

  return (
    <FlatList
      data={routeWaypoints}
      keyExtractor={(item, idx) => idx.toString()}
      renderItem={({ item, index }) => (
        <View style={styles.row}>
          {/* Timeline */}
          <View style={styles.timeline}>
            {/* Top line */}
            {index !== 0 && <View style={styles.line} />}
            {/* Circle */}
            <View
              style={[
                styles.circle,
                index === 0 ? styles.circleActive : null,
                index === routeWaypoints.length - 1 ? styles.circleTerminal : null,
              ]}
            />
            {/* Bottom line */}
            {index !== routeWaypoints.length - 1 && <View style={styles.line} />}
          </View>
          {/* Stop info */}
          <View style={styles.info}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.time}>{item.time || '--:--'}</Text>
              {item.eta && (
                <Text style={styles.eta}>  ({item.eta})</Text>
              )}
              {item.delay && (
                <Text style={styles.delay}>  +{item.delay} min</Text>
              )}
            </View>
            <Text style={styles.name}>{item.name}</Text>
            {item.platform && (
              <Text style={styles.platform}>Platform: {item.platform}</Text>
            )}
            {item.distance != null && (
              <Text style={styles.distance}>
                <Ionicons name="navigate" size={14} color="#018abe" /> {formatDistance(item.distance)} from you
              </Text>
            )}
          </View>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32, // Increased spacing between stops
    minHeight: 56,    // Increased minimum height for each row
  },
  timeline: {
    width: 40, // Increased width for timeline area
    alignItems: 'center',
    position: 'relative',
  },
  line: {
    width: 3, // Thicker line
    height: 28, // Longer line for more spacing
    backgroundColor: '#018abe',
    position: 'absolute',
    left: 18.5, // Centered for bigger circle
    zIndex: 0,
  },
  circle: {
    width: 28, // Larger icon
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 5,
    borderColor: '#018abe',
    marginVertical: 0,
    zIndex: 1,
    marginTop: 0,
    marginBottom: 0,
  },
  circleActive: {
    backgroundColor: '#018abe',
  },
  circleTerminal: {
    borderColor: '#43a047',
  },
  info: {
    marginLeft: 18, // More space between icon and text
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  time: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#018abe',
  },
  eta: {
    fontSize: 15,
    color: '#888',
    marginLeft: 4,
  },
  delay: {
    fontSize: 15,
    color: '#d32f2f',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 18,
    fontWeight: '500',
    color: '#222',
    marginTop: 4,
  },
  platform: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  distance: {
    fontSize: 13,
    color: '#018abe',
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default StopListComponent;