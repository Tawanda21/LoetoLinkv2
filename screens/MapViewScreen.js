import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Button } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import haversine from 'haversine-distance';
import StopListComponent from '../components/StopListComponent';
import Modal from 'react-native-modal'; // Import react-native-modal
import { Ionicons } from '@expo/vector-icons'; // Add this for hamburger icon

const MapViewScreen = ({ route }) => {
  const { origin, destination, waypoints, routeWaypoints, route_name } = route.params || {};
  const [userLocation, setUserLocation] = useState(null);
  const [closestPointIndex, setClosestPointIndex] = useState(null);
  const [detailedWaypoints, setDetailedWaypoints] = useState([]);
  const [initialRegion, setInitialRegion] = useState({ // Set Gaborone as the default
    latitude: -24.6282, // Gaborone latitude
    longitude: 25.9231, // Gaborone longitude
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isModalVisible, setModalVisible] = useState(false); // State for modal visibility
  const [isMenuVisible, setMenuVisible] = useState(false); // Add menu state
  const mapRef = useRef(null); // Ref for the MapView

  const [mapType, setMapType] = useState('standard'); // 'standard' or 'satellite'
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [streetViewEnabled, setStreetViewEnabled] = useState(false);

  const [filteredRouteWaypoints, setFilteredRouteWaypoints] = useState([]); // Add filteredRouteWaypoints state

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  useEffect(() => {
    if (waypoints) {
      const interpolatedWaypoints = interpolateWaypoints(waypoints, 10);
      setDetailedWaypoints(interpolatedWaypoints);
    }
  }, [waypoints]);

  useEffect(() => {
    if (userLocation && detailedWaypoints) {
      findClosestPointOnRoute(userLocation, detailedWaypoints);
    }
  }, [userLocation, detailedWaypoints]);

  useEffect(() => {
    // Set initial region based on origin or routeWaypoints
    if (origin) {
      setInitialRegion({
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } else if (routeWaypoints && routeWaypoints.length > 0) {
      setInitialRegion({
        latitude: parseFloat(routeWaypoints[0].latitude),
        longitude: parseFloat(routeWaypoints[0].longitude),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [origin, routeWaypoints]);

  useEffect(() => {
    if (routeWaypoints && origin && destination) {
      const fromStop = routeWaypoints.find(
        stop => Math.abs(parseFloat(stop.latitude) - origin.latitude) < 0.0001 &&
                Math.abs(parseFloat(stop.longitude) - origin.longitude) < 0.0001
      );
      const toStop = routeWaypoints.find(
        stop => Math.abs(parseFloat(stop.latitude) - destination.latitude) < 0.0001 &&
                Math.abs(parseFloat(stop.longitude) - destination.longitude) < 0.0001
      );

      if (fromStop && toStop) {
        const fromOrder = fromStop.stop_order;
        const toOrder = toStop.stop_order;
        const filtered = routeWaypoints.filter(
          stop => stop.stop_order >= fromOrder && stop.stop_order <= toOrder
        );
        setFilteredRouteWaypoints(filtered);
      } else {
        setFilteredRouteWaypoints(routeWaypoints);
      }
    }
  }, [routeWaypoints, origin, destination]);

  const interpolateWaypoints = (waypoints, numPoints) => {
    const interpolated = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];

      for (let j = 0; j < numPoints; j++) {
        const ratio = j / numPoints;
        const latitude = start.latitude + (end.latitude - start.latitude) * ratio;
        const longitude = start.longitude + (end.longitude - start.longitude) * ratio;
        interpolated.push({ latitude, longitude });
      }
    }
    interpolated.push(waypoints[waypoints.length - 1]); // Add the last waypoint
    return interpolated;
  };

  const findClosestPointOnRoute = (userLocation, waypoints) => {
    let minDistance = Infinity;
    let closestIndex = null;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];

      const distanceToSegment = distanceToLineSegment(userLocation, start, end);

      if (distanceToSegment < minDistance) {
        minDistance = distanceToSegment;
        closestIndex = i;
      }
    }

    setClosestPointIndex(closestIndex);
  };

  const distanceToLineSegment = (point, start, end) => {
    const A = point.latitude - start.latitude;
    const B = point.longitude - start.longitude;
    const C = end.latitude - start.latitude;
    const D = end.longitude - start.longitude;

    const dotProduct = A * C + B * D;
    const segmentLengthSquared = C * C + D * D;

    let param = -1;
    if (segmentLengthSquared !== 0) {
      param = dotProduct / segmentLengthSquared;
    }

    let nearestPoint;

    if (param < 0) {
      nearestPoint = start;
    } else if (param > 1) {
      nearestPoint = end;
    } else {
      nearestPoint = {
        latitude: start.latitude + param * C,
        longitude: start.longitude + param * D,
      };
    }

    return haversine(point, nearestPoint);
  };

  const handleZoomIn = () => {
    if (mapRef.current && initialRegion) {
      mapRef.current.animateToRegion(
        {
          ...initialRegion,
          latitudeDelta: initialRegion.latitudeDelta / 2,
          longitudeDelta: initialRegion.longitudeDelta / 2,
        },
        200
      );
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current && initialRegion) {
      mapRef.current.animateToRegion(
        {
          ...initialRegion,
          latitudeDelta: initialRegion.latitudeDelta * 2,
          longitudeDelta: initialRegion.longitudeDelta * 2,
        },
        200
      );
    }
  };

  const toggleMapType = () => {
    setMapType(mapType === 'standard' ? 'satellite' : 'standard');
  };

  const toggleTraffic = () => {
    setTrafficEnabled(!trafficEnabled);
  };

  const toggleStreetView = () => {
    setStreetViewEnabled(!streetViewEnabled);
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  // Center map on user location
  const handleMyLocation = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        200
      );
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        mapType={mapType}
        trafficEnabled={trafficEnabled}
      >
        {origin && <Marker coordinate={origin} title="Origin" />}
        {destination && <Marker coordinate={destination} title="Destination" />}

        {detailedWaypoints && (
          <Polyline
            coordinates={detailedWaypoints}
            strokeColor="#0000FF"
            strokeWidth={3}
          />
        )}

        {closestPointIndex !== null && detailedWaypoints && closestPointIndex < detailedWaypoints.length - 1 && (
          <Polyline
            coordinates={[detailedWaypoints[closestPointIndex], detailedWaypoints[closestPointIndex + 1]]}
            strokeColor="#FF0000"
            strokeWidth={5}
          />
        )}

        {filteredRouteWaypoints && filteredRouteWaypoints.map((stop, index) => (
          <Marker
            key={index}
            coordinate={{ 
              latitude: parseFloat(stop.latitude), 
              longitude: parseFloat(stop.longitude) 
            }}
            title={stop.name}
            // Add different pin color for terminals
            pinColor={stop.stop_order === 0 || stop.stop_order === 999 ? 'green' : 'red'}
          />
        ))}
      </MapView>

      {/* Floating Zoom Buttons */}
      <View style={styles.controlsContainer}>
        <View style={styles.zoomButtonsContainer}>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
            <Text style={styles.zoomButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
            <Text style={styles.zoomButtonText}>-</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hamburger Menu Button */}
      <TouchableOpacity
        style={styles.hamburgerButton}
        onPress={() => setMenuVisible(true)}
      >
        <Ionicons name="menu" size={32} color="white" />
      </TouchableOpacity>

       <Modal 
        isVisible={isMenuVisible} 
        onBackdropPress={() => setMenuVisible(false)}
        animationIn="zoomIn"
        animationInTiming={500}
      >
        <View style={styles.menuModal}>
          <TouchableOpacity style={styles.menuItem} onPress={toggleMapType}>
            <Text style={styles.menuItemText}>{mapType === 'standard' ? 'Satellite' : 'Standard'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={toggleTraffic}>
            <Text style={styles.menuItemText}>{trafficEnabled ? 'Hide Traffic' : 'Show Traffic'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={toggleModal}>
            <Text style={styles.menuItemText}>Show Stop List</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleMyLocation}>
            <Text style={styles.menuItemText}>My Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, {marginTop: 10}]} onPress={() => setMenuVisible(false)}>
            <Text style={[styles.menuItemText, {color: '#018abe'}]}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Stop List Modal */}
      <Modal 
        isVisible={isModalVisible} 
        onBackdropPress={toggleModal}
        animationIn="zoomIn"
        animationInTiming={500}
      >
        <View style={[styles.modalContent,{ maxHeight: Dimensions.get('window').height * 0.85, width: Dimensions.get('window').width * 0.95, alignSelf: 'center'}]}>
          <Text style={styles.bottomSheetTitle}>Route Stops</Text>
          {route_name && (
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#018abe', marginBottom: 10 }}>
              Riding: {route_name}
            </Text>
          )}
          <StopListComponent routeWaypoints={filteredRouteWaypoints} />
          <TouchableOpacity onPress={toggleModal} style={{marginTop: 20, alignSelf: 'center'}}>
            <Text style={{color: '#018abe', fontWeight: 'bold', fontSize: 16}}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  controlsContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  zoomButtonsContainer: {
    flexDirection: 'column',
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  zoomButton: {
    backgroundColor: 'rgba(1, 138, 190, 0.8)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  zoomButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  mapTypeContainer: {
    flexDirection: 'column',
  },
  mapTypeButton: {
    backgroundColor: 'rgba(1, 138, 190, 0.8)',
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
  },
  mapTypeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  showListButton: {
    position: 'absolute',
    top: 80,
    left: 20,
    backgroundColor: 'rgba(1, 138, 190, 0.8)',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  showListButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    borderRadius: 24, // More rounded corners
    borderColor: 'rgba(0, 0, 0, 0.1)',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    // Shadow for Android
    elevation: 12,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  hamburgerButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(1, 138, 190, 0.9)',
    padding: 10,
    borderRadius: 25,
    zIndex: 10,
  },
  menuModal: {
    backgroundColor: 'white',
    padding: 22,
    borderRadius: 10,
    alignItems: 'stretch',
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    fontSize: 18,
    color: '#222',
    fontWeight: 'bold',
  },
});

export default MapViewScreen;