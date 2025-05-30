import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import * as Location from 'expo-location';
import haversine from 'haversine-distance';
import UserHeader from '../components/UserHeader';
import { decodePolyline } from '../utils';

const HomeScreen = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [stops, setStops] = useState([]);
  const [filteredFromStops, setFilteredFromStops] = useState([]);
  const [filteredToStops, setFilteredToStops] = useState([]);
  const navigation = useNavigation();
  const [fromStopData, setFromStopData] = useState(null); // Store the selected "From" stop data
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  useEffect(() => {
    const fetchStops = async () => {
      const { data, error } = await supabase.from('stops').select('*');
      if (error) {
        Alert.alert('Error', 'Failed to fetch stops.');
        return;
      }
      setStops(data);
    };
    fetchStops();
  }, []);

  const handleInputChange = async (text, type) => {
    if (!text.trim()) {
      type === 'from' ? setFilteredFromStops([]) : setFilteredToStops([]);
      return;
    }

    try {
      // First, search in stops table
      const { data: stopData, error: stopError } = await supabase
        .from('stops')
        .select('*')
        .ilike('name', `%${text}%`);

      if (stopError) {
        console.error('Error fetching stops:', stopError);
        return;
      }

      // Next, search in combi_routes table for terminals
      const { data: routeData, error: routeError } = await supabase
        .from('combi_routes')
        .select('*');

      if (routeError) {
        console.error('Error fetching routes:', routeError);
        return;
      }

      // Create terminal entries from routes
      const terminalEntries = [];
      routeData.forEach(route => {
        // Add origin terminals
        if (route.origin.toLowerCase().includes(text.toLowerCase())) {
          terminalEntries.push({
            id: `origin-${route.id}`,
            name: route.origin,
            latitude: route.origin_latitude,
            longitude: route.origin_longitude,
            route_id: route.id,
            stop_order: 0,
            isTerminal: true
          });
        }
        
        // Add destination terminals
        if (route.destination.toLowerCase().includes(text.toLowerCase())) {
          terminalEntries.push({
            id: `destination-${route.id}`,
            name: route.destination,
            latitude: route.destination_latitude,
            longitude: route.destination_longitude,
            route_id: route.id,
            stop_order: 999,
            isTerminal: true
          });
        }
      });

      // Combine and filter results
      let combinedResults;
      
      if (type === 'to' && fromStopData) {
        // If "from" is selected, only show stops on the same route
        combinedResults = [
          ...stopData.filter(stop => stop.route_id === fromStopData.route_id),
          ...terminalEntries.filter(terminal => terminal.route_id === fromStopData.route_id)
        ];
      } else {
        // Otherwise show all matching results
        combinedResults = [...stopData, ...terminalEntries];
      }
      
      // Update state with filtered results
      if (type === 'from') {
        setFrom(text);
        setFilteredFromStops(combinedResults);
      } else {
        setTo(text);
        setFilteredToStops(combinedResults);
      }
    } catch (error) {
      console.error('Error in handleInputChange:', error);
      Alert.alert('Error', 'Failed to search for stops and terminals.');
    }
  };

  const handleSelectStop = (stop, type) => {
    if (type === 'from') {
      setFrom(stop.name);
      setFromStopData(stop);
      setFilteredFromStops([]);
    } else {
      setTo(stop.name);
      setFilteredToStops([]);
    }
  };

  const clearFrom = () => {
    setFrom('');
    setFilteredFromStops([]);
    setFromStopData(null);
  };
  const clearTo = () => {
    setTo('');
    setFilteredToStops([]);
  };

  const handleSwapStops = async () => {
    const tempFrom = from;
    const tempTo = to;

    // Fetch the stop data for the "To" stop
    const { data: toStopData, error: toStopError } = await supabase
      .from('stops')
      .select('*')
      .eq('name', tempTo)
      .single();

    if (toStopError) {
      Alert.alert('Error', 'Failed to fetch stop data after swap.');
      return;
    }

    setFrom(tempTo);
    setTo(tempFrom);
    setFromStopData(toStopData || null); // Update fromStopData with the "To" stop data
  };

  const handleSearch = async () => {
    if (!from || !to) {
      Alert.alert('Error', 'Please enter both "From" and "To" stops.');
      return;
    }

    setIsLoading(true); // Start loading

    try {
      // Get the stop details
      const { data: fromStopData, error: fromStopError } = await supabase
        .from('stops')
        .select('*')
        .eq('name', from)
        .single();

      const { data: toStopData, error: toStopError } = await supabase
        .from('stops')
        .select('*')
        .eq('name', to)
        .single();

      // Get the route details
      const { data: routeData, error: routeError } = await supabase
        .from('combi_routes')
        .select('*')
        .eq('id', fromStopData?.route_id)
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
        latitude: parseFloat(fromStopData.latitude),
        longitude: parseFloat(fromStopData.longitude)
      };

      // Set the destination coordinates
      const destination = isToTerminal ? {
        latitude: parseFloat(routeData.destination_latitude),
        longitude: parseFloat(routeData.destination_longitude)
      } : {
        latitude: parseFloat(toStopData.latitude),
        longitude: parseFloat(toStopData.longitude)
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
        .eq('route_id', fromStopData.route_id)
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

          // Modified directions URL with additional parameters
          const directionsUrl = `https://maps.gomaps.pro/maps/api/directions/json?` +
            `origin=${waypoints[0].latitude},${waypoints[0].longitude}&` +
            `destination=${waypoints[waypoints.length-1].latitude},${waypoints[waypoints.length-1].longitude}&` +
            `waypoints=optimize:false|${waypointsStr}&` +
            `mode=driving&` +
            `alternatives=true&` +
            `avoid=highways|ferries&` + // Avoid highways to prefer local roads
            `key=AlzaSykD0-TOgCvku5D5nyYC67DmWk2aaon-COn`;

          const response = await fetch(directionsUrl);
          const directionsData = await response.json();

          if (directionsData.status === 'OK') {
            // Try to select the shortest route if alternatives are available
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
          (isFromTerminal || stop.stop_order >= fromStopData.stop_order) &&
          (!isToTerminal || stop.stop_order <= toStopData.stop_order)
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

      // Navigate with the complete route
      navigation.navigate('MainTabNavigator', {
        screen: 'MapViewScreen',
        params: {
          origin,
          destination,
          waypoints: allWaypoints,
          routeWaypoints: completeWaypoints,
          route_name: routeData?.route_name || routeData?.name, // <-- Add this line
        },
      });
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleUseMyLocation = async () => {
    // Check permission status
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    console.log('Location permission status:', status);

    if (status !== 'granted') {
      if (canAskAgain) {
        const { status: requestStatus } = await Location.requestForegroundPermissionsAsync();
        console.log('Requested location permission, new status:', requestStatus);
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
      console.log('My current location:', latitude, longitude);

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
        // Show relation in alert
        Alert.alert(
          'Nearest Stop',
          `Your location:\nLat: ${latitude}\nLng: ${longitude}\n\nNearest stop: ${nearestStop.name}\nLat: ${nearestStop.latitude}\nLng: ${nearestStop.longitude}\n\nDistance: ${(minDistance / 1000).toFixed(2)} km`
        );
      } else {
        Alert.alert('No Stops Found', 'Could not find any stops nearby.');
      }
    } catch (error) {
      console.log('Error getting location:', error);
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