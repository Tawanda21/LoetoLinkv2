import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  FlatList,
  Animated,
  PanResponder,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import haversine from 'haversine-distance';
import StopListComponent from '../components/StopListComponent';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOMAPS_API_KEY = 'AlzaSy0csWCFtrxT-TmMw4adcHN41jNcy0mdvdf'; // Use your actual key

const BOTTOM_SHEET_HEIGHT = Dimensions.get('window').height * 0.55;
const BOTTOM_SHEET_PEEK = 48; // Height when hidden except for arrow

// Helper to get ETA for each stop
const fetchRouteWithETA = async (waypoints) => {
  if (!waypoints || waypoints.length < 2) return [];

  const origin = `${waypoints[0].latitude},${waypoints[0].longitude}`;
  const destination = `${waypoints[waypoints.length - 1].latitude},${waypoints[waypoints.length - 1].longitude}`;
  const waypointsStr = waypoints.slice(1, -1).map(wp => `${wp.latitude},${wp.longitude}`).join('|');

  const url = `https://maps.gomaps.pro/maps/api/directions/json?origin=${origin}&destination=${destination}` +
    (waypointsStr ? `&waypoints=${waypointsStr}` : '') +
    `&mode=driving&traffic_model=best_guess&departure_time=now&key=${GOMAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== 'OK') return [];

    // Each leg corresponds to a segment between stops
    const legs = data.routes[0].legs;
    let cumulativeSeconds = 0;
    const now = Date.now();

    // Build ETA for each stop (including origin)
    const etas = waypoints.map((stop, idx) => {
      if (idx === 0) {
        return { ...stop, eta: 'Now' };
      }
      // Prefer duration_in_traffic if available, else fallback to duration
      const leg = legs[idx - 1];
      const durationSeconds = leg?.duration_in_traffic?.value ?? leg?.duration?.value ?? 0;
      cumulativeSeconds += durationSeconds;
      const etaDate = new Date(now + cumulativeSeconds * 1000);
      const etaStr = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { ...stop, eta: etaStr };
    });

    return etas;
  } catch (e) {
    console.log('Error fetching ETA:', e);
    return waypoints.map(stop => ({ ...stop, eta: null }));
  }
};

const MapViewScreen = ({ route }) => {
  const { origin, destination, waypoints, routeWaypoints, route_name } = route.params || {};
  const [userLocation, setUserLocation] = useState(null);
  const [closestPointIndex, setClosestPointIndex] = useState(null);
  const [detailedWaypoints, setDetailedWaypoints] = useState([]);
  const [initialRegion, setInitialRegion] = useState({
    latitude: -24.6282,
    longitude: 25.9231,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const mapRef = useRef(null);

  const [mapType, setMapType] = useState('standard');
  const [trafficEnabled, setTrafficEnabled] = useState(false);

  const [filteredRouteWaypoints, setFilteredRouteWaypoints] = useState([]);
  const [waypointsWithETA, setWaypointsWithETA] = useState([]);

  // For previous routes
  const [previousRoutes, setPreviousRoutes] = useState([]);
  const hasRoute = !!route_name;

  // Bottom sheet animation
  const [sheetVisible, setSheetVisible] = useState(true);
  const animatedValue = useRef(new Animated.Value(0)).current; // 0 = visible, 1 = hidden

  const showSheet = () => {
    setSheetVisible(true);
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideSheet = () => {
    setSheetVisible(false);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // PanResponder for swipe up/down
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          hideSheet();
        } else if (gestureState.dy < -50) {
          showSheet();
        }
      },
    })
  ).current;

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BOTTOM_SHEET_HEIGHT - BOTTOM_SHEET_PEEK],
  });

  // Save new route to previous routes
  useEffect(() => {
    if (route_name && waypointsWithETA.length > 0) {
      AsyncStorage.getItem('previousRoutes').then(data => {
        let routes = data ? JSON.parse(data) : [];
        // Avoid duplicates
        if (!routes.find(r => r.route_name === route_name)) {
          routes.unshift({ route_name, waypoints: waypointsWithETA });
          routes = routes.slice(0, 5); // Keep only last 5
          AsyncStorage.setItem('previousRoutes', JSON.stringify(routes));
        }
      });
    }
  }, [route_name, waypointsWithETA]);

  // Load previous routes if no route
  useEffect(() => {
    if (!hasRoute) {
      AsyncStorage.getItem('previousRoutes').then(data => {
        setPreviousRoutes(data ? JSON.parse(data) : []);
      });
    }
  }, [hasRoute]);

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

  useEffect(() => {
    if (filteredRouteWaypoints && filteredRouteWaypoints.length > 1) {
      const numericWaypoints = filteredRouteWaypoints.map(wp => ({
        ...wp,
        latitude: typeof wp.latitude === 'string' ? parseFloat(wp.latitude) : wp.latitude,
        longitude: typeof wp.longitude === 'string' ? parseFloat(wp.longitude) : wp.longitude,
      }));
      fetchRouteWithETA(numericWaypoints).then(setWaypointsWithETA);
    } else {
      setWaypointsWithETA(filteredRouteWaypoints || []);
    }
  }, [filteredRouteWaypoints]);

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
    interpolated.push(waypoints[waypoints.length - 1]);
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

  // Select a previous route
  const handleSelectPreviousRoute = (routeObj) => {
    setFilteredRouteWaypoints(routeObj.waypoints);
    // Optionally update route_name if you want to display it
    // setRouteName(routeObj.route_name);
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

      {/* Animated Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY }],
            height: BOTTOM_SHEET_HEIGHT,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Up Arrow Button (show only when hidden) */}
        {!sheetVisible && (
          <TouchableOpacity
            style={styles.upArrowButton}
            onPress={showSheet}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-up" size={32} color="#018abe" />
          </TouchableOpacity>
        )}

        {/* Drag Handle (show only when visible) */}
        {sheetVisible && <View style={styles.dragHandle} />}

        {/* Route Name or Previous Routes */}
        {sheetVisible && (
          <>
            <Text style={styles.routeTitle}>
              {hasRoute ? route_name : 'Previous Routes'}
            </Text>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={toggleMapType}>
                <Ionicons name={mapType === 'standard' ? 'map' : 'map-outline'} size={24} color="#018abe" />
                <Text style={styles.actionText}>{mapType === 'standard' ? 'Satellite' : 'Standard'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={toggleTraffic}>
                <Ionicons name="car" size={24} color="#018abe" />
                <Text style={styles.actionText}>{trafficEnabled ? 'Hide Traffic' : 'Show Traffic'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleMyLocation}>
                <Ionicons name="locate" size={24} color="#018abe" />
                <Text style={styles.actionText}>My Location</Text>
              </TouchableOpacity>
            </View>

            {/* Stop List or Previous Routes */}
            <View style={{ flex: 1, maxHeight: '60%' }}>
              {hasRoute ? (
                <FlatList
                  data={[{ id: 'single', data: waypointsWithETA }]}
                  renderItem={({ item }) => (
                    <StopListComponent
                      routeWaypoints={item.data}
                      contentContainerStyle={{ paddingBottom: 20 }}
                    />
                  )}
                  keyExtractor={item => item.id}
                />
              ) : (
                <FlatList
                  data={previousRoutes.length > 0 ? previousRoutes : [{ id: 'empty' }]}
                  renderItem={({ item }) =>
                    item.id === 'empty' ? (
                      <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No previous routes.</Text>
                    ) : (
                      <TouchableOpacity
                        style={styles.prevRouteCard}
                        onPress={() => handleSelectPreviousRoute(item)}
                      >
                        <Text style={styles.prevRouteName}>{item.route_name}</Text>
                        <StopListComponent routeWaypoints={item.waypoints} />
                      </TouchableOpacity>
                    )
                  }
                  keyExtractor={(item, index) => item.id || index.toString()}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              )}
            </View>
          </>
        )}
      </Animated.View>
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
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,1.0)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
    minHeight: 48,
    maxHeight: Dimensions.get('window').height * 0.55,
    overflow: 'hidden',
  },
  upArrowButton: {
    position: 'absolute',
    left: 18,
    top: 8,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,1.0)',
    borderRadius: 20,
    padding: 2,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
    marginBottom: 10,
  },
  routeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    fontSize: 13,
    color: '#018abe',
    marginTop: 2,
  },
  prevRouteCard: {
    backgroundColor: '#f6f7fa',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  prevRouteName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#018abe',
    marginBottom: 4,
  },
});

export default MapViewScreen;