import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import * as Location from 'expo-location';
import haversine from 'haversine-distance';
import UserHeader from '../components/UserHeader';
import { decodePolyline } from '../utils';
import { debounce } from 'lodash';

const HomeScreen = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [stops, setStops] = useState([]);
  const [filteredFromStops, setFilteredFromStops] = useState([]);
  const [filteredToStops, setFilteredToStops] = useState([]);
  const navigation = useNavigation();
  const [fromStopData, setFromStopData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allStopsAndTerminals, setAllStopsAndTerminals] = useState([]);

  // Fetch all stops and terminals ONCE for smooth filtering
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data: stopsData, error: stopsError } = await supabase.from('stops').select('*');
        const { data: routesData, error: routesError } = await supabase.from('combi_routes').select('*');
        if (stopsError || routesError) {
          Alert.alert('Error', 'Failed to fetch stops or routes.');
          return;
        }
        setStops(stopsData);

        // Create terminal entries
        const terminals = [];
        routesData.forEach(route => {
          terminals.push({
            id: `origin-${route.id}`,
            name: route.origin,
            latitude: route.origin_latitude,
            longitude: route.origin_longitude,
            route_id: route.id,
            stop_order: 0,
            isTerminal: true
          });
          terminals.push({
            id: `destination-${route.id}`,
            name: route.destination,
            latitude: route.destination_latitude,
            longitude: route.destination_longitude,
            route_id: route.id,
            stop_order: 999,
            isTerminal: true
          });
        });
        setAllStopsAndTerminals([...stopsData, ...terminals]);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch stops and terminals.');
      }
    };
    fetchAll();
  }, []);

  // Debounced filter function for smooth UX
  const debouncedFilter = useRef(
    debounce((text, type, fromStopDataRef, allStopsAndTerminalsRef) => {
      if (!text.trim()) {
        type === 'from' ? setFilteredFromStops([]) : setFilteredToStops([]);
        return;
      }
      let filtered = allStopsAndTerminalsRef.filter(stop =>
        stop.name.toLowerCase().includes(text.toLowerCase())
      );
      // If filtering "to", restrict to same route as "from"
      if (type === 'to' && fromStopDataRef) {
        filtered = filtered.filter(stop => stop.route_id === fromStopDataRef.route_id);
      }
      if (type === 'from') {
        setFilteredFromStops(filtered);
      } else {
        setFilteredToStops(filtered);
      }
    }, 200)
  ).current;

  const handleInputChange = (text, type) => {
    if (type === 'from') setFrom(text);
    else setTo(text);
    debouncedFilter(
      text,
      type,
      fromStopData,
      allStopsAndTerminals
    );
  };

  const handleSelectStop = (stop, type) => {
    if (type === 'from') {
      setFrom(stop.name);
      setFromStopData(stop);
      setFilteredFromStops([]);
      setTo('');
      setFilteredToStops([]);
    } else {
      setTo(stop.name);
      setFilteredToStops([]);
    }
  };

  const clearFrom = () => {
    setFrom('');
    setFilteredFromStops([]);
    setFromStopData(null);
    setTo('');
    setFilteredToStops([]);
  };
  const clearTo = () => {
    setTo('');
    setFilteredToStops([]);
  };

  const handleSwapStops = async () => {
    const tempFrom = from;
    const tempTo = to;

    // Find the stop data for the "To" stop in allStopsAndTerminals
    const toStopData = allStopsAndTerminals.find(stop => stop.name === tempTo);

    setFrom(tempTo);
    setTo(tempFrom);
    setFromStopData(toStopData || null);
    setFilteredFromStops([]);
    setFilteredToStops([]);
  };

  const handleSearch = async () => {
    if (!from || !to) {
      Alert.alert('Error', 'Please enter both "From" and "To" stops.');
      return;
    }

    setIsLoading(true);

    try {
      // Get the stop details from allStopsAndTerminals
      const fromStopDataObj = allStopsAndTerminals.find(stop => stop.name === from);
      const toStopDataObj = allStopsAndTerminals.find(stop => stop.name === to);

      if (!fromStopDataObj || !toStopDataObj) {
        Alert.alert('Error', 'Invalid stop selection.');
        return;
      }

      // Get the route details
      const { data: routeData, error: routeError } = await supabase
        .from('combi_routes')
        .select('*')
        .eq('id', fromStopDataObj?.route_id)
        .single();

      if (routeError) {
        Alert.alert('Error', 'Failed to fetch route details.');
        return;
      }

      // Determine if using stops or terminals
      const isFromTerminal = from === routeData.origin;
      const isToTerminal = to === routeData.destination;

      // Set the origin coordinates
      const origin = isFromTerminal ? {
        latitude: parseFloat(routeData.origin_latitude),
        longitude: parseFloat(routeData.origin_longitude)
      } : {
        latitude: parseFloat(fromStopDataObj.latitude),
        longitude: parseFloat(fromStopDataObj.longitude)
      };

      // Set the destination coordinates
      const destination = isToTerminal ? {
        latitude: parseFloat(routeData.destination_latitude),
        longitude: parseFloat(routeData.destination_longitude)
      } : {
        latitude: parseFloat(toStopDataObj.latitude),
        longitude: parseFloat(toStopDataObj.longitude)
      };

      // Fetch waypoints including terminals if needed
      const { data: routeWaypoints, error: routeWaypointsError } = await supabase
        .from('stops')
        .select(`
          latitude, 
          longitude, 
          stop_order, 
          name,
          route_id
        `)
        .eq('route_id', fromStopDataObj.route_id)
        .order('stop_order', { ascending: true });

      if (routeWaypointsError) {
        Alert.alert('Error', 'Failed to fetch route waypoints.');
        return;
      }

      // Replace the existing waypoints generation code
      const getDetailedRoute = async (waypoints) => {
        try {
          const waypointsStr = waypoints
            .map(wp => `${wp.latitude},${wp.longitude}`)
            .join('|');

          const directionsUrl = `https://maps.gomaps.pro/maps/api/directions/json?` +
            `origin=${waypoints[0].latitude},${waypoints[0].longitude}&` +
            `destination=${waypoints[waypoints.length-1].latitude},${waypoints[waypoints.length-1].longitude}&` +
            `waypoints=optimize:false|${waypointsStr}&` +
            `mode=driving&` +
            `alternatives=true&` +
            `avoid=highways|ferries&` +
            `key=AlzaSykD0-TOgCvku5D5nyYC67DmWk2aaon-COn`;

          const response = await fetch(directionsUrl);
          const directionsData = await response.json();

          if (directionsData.status === 'OK') {
            const routes = directionsData.routes;
            let shortestRoute = routes[0];
            let shortestDistance = Number.MAX_VALUE;

            routes.forEach(route => {
              const distance = route.legs.reduce((total, leg) => total + leg.distance.value, 0);
              if (distance < shortestDistance) {
                shortestDistance = distance;
                shortestRoute = route;
              }
            });

            return decodePolyline(shortestRoute.overview_polyline.points);
          } else {
            console.error('Failed to fetch directions:', directionsData.status);
            return [];
          }
        } catch (error) {
          console.error('Error fetching route:', error);
          return [];
        }
      };

      // Create complete waypoint list including terminals
      let completeWaypoints = [];

      // Add origin terminal if starting from there
      if (isFromTerminal) {
        completeWaypoints.push({
          latitude: parseFloat(routeData.origin_latitude),
          longitude: parseFloat(routeData.origin_longitude),
          name: routeData.origin,
          stop_order: 0
        });
      }

      // Add intermediate stops
      completeWaypoints = [
        ...completeWaypoints,
        ...routeWaypoints.filter(stop =>
          (isFromTerminal || stop.stop_order >= fromStopDataObj.stop_order) &&
          (!isToTerminal || stop.stop_order <= toStopDataObj.stop_order)
        )
      ];

      // Add destination terminal if ending there
      if (isToTerminal) {
        completeWaypoints.push({
          latitude: parseFloat(routeData.destination_latitude),
          longitude: parseFloat(routeData.destination_longitude),
          name: routeData.destination,
          stop_order: routeWaypoints.length + 1
        });
      }

      // Get the continuous route
      const allWaypoints = await getDetailedRoute(completeWaypoints);

      navigation.navigate('MainTabNavigator', {
        screen: 'MapViewScreen',
        params: {
          origin,
          destination,
          waypoints: allWaypoints,
          routeWaypoints: completeWaypoints,
          route_name: routeData?.route_name || routeData?.name,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseMyLocation = async () => {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      if (canAskAgain) {
        const { status: requestStatus } = await Location.requestForegroundPermissionsAsync();
        if (requestStatus !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
          return;
        }
      } else {
        Alert.alert('Permission Denied', 'Location permission is not enabled. Please enable it in your device settings.');
        return;
      }
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      let nearestStop = null;
      let minDistance = Infinity;

      stops.forEach((stop) => {
        const stopLat = Number(stop.latitude);
        const stopLng = Number(stop.longitude);
        const distance = haversine(
          { latitude: Number(latitude), longitude: Number(longitude) },
          { latitude: stopLat, longitude: stopLng }
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestStop = stop;
        }
      });

      if (nearestStop) {
        setFrom(nearestStop.name);
        setFromStopData(nearestStop);
        setFilteredFromStops([]);
        setTo('');
        setFilteredToStops([]);
        Alert.alert(
          'Nearest Stop',
          `Your location:\nLat: ${latitude}\nLng: ${longitude}\n\nNearest stop: ${nearestStop.name}\nLat: ${nearestStop.latitude}\nLng: ${nearestStop.longitude}\n\nDistance: ${(minDistance / 1000).toFixed(2)} km`
        );
      } else {
        Alert.alert('No Stops Found', 'Could not find any stops nearby.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location.');
    }
  };

  return (
    <View style={styles.container}>
      <UserHeader onAvatarPress={() => navigation.navigate('Profile')} />
      <View style={styles.inputContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="From..."
            value={from}
            onChangeText={(text) => handleInputChange(text, 'from')}
          />
          {from.length > 0 && (
            <TouchableOpacity onPress={clearFrom} style={{ marginLeft: -35, zIndex: 1 }}>
              <Text style={{ fontSize: 18, color: '#888' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {filteredFromStops.length > 0 && (
          <FlatList
            style={styles.dropdown}
            data={filteredFromStops}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleSelectStop(item, 'from')}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
      <TouchableOpacity style={styles.swapButton} onPress={handleSwapStops}>
        <Text style={styles.swapButtonText}>&#8645;</Text>
      </TouchableOpacity>
      <View style={styles.inputContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="To..."
            value={to}
            onChangeText={(text) => handleInputChange(text, 'to')}
            editable={from !== ''}
          />
          {to.length > 0 && (
            <TouchableOpacity onPress={clearTo} style={{ marginLeft: -35, zIndex: 1 }}>
              <Text style={{ fontSize: 18, color: '#888' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {filteredToStops.length > 0 && (
          <FlatList
            style={styles.dropdown}
            data={filteredToStops}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleSelectStop(item, 'to')}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSearch} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.buttonText}>Search</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleUseMyLocation}>
        <Text style={styles.buttonText}>Use My Location</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 15,
    paddingHorizontal: 15,
    backgroundColor: 'white',
  },
  dropdown: {
    maxHeight: 150,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  button: {
    backgroundColor: '#018abe',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  swapButton: {
    backgroundColor: '#018abe',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    alignSelf: 'center',
  },
  swapButtonText: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
  },
});

export default HomeScreen;