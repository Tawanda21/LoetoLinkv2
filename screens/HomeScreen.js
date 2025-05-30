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
    let query = supabase.from('stops').select('*').ilike('name', `%${text}%`);
    if (type === 'to' && fromStopData) {
      query = query.eq('route_id', fromStopData.route_id);
    }
    const { data, error } = await query;
    if (error) {
      Alert.alert('Error', 'Failed to fetch stops.');
      return;
    }
    if (type === 'from') {
      setFrom(text);
      setFilteredFromStops(data);
    } else {
      setTo(text);
      setFilteredToStops(data);
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
      // Fetch the stop details from the database based on the selected names
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

      if (fromStopError || toStopError) {
        Alert.alert('Error', 'One or both stops not found.');
        return;
      }

      const fromStop = fromStopData;
      const toStop = toStopData;

      if (!fromStop || !toStop) {
        Alert.alert('Error', 'One or both stops not found.');
        return;
      }

      if (fromStop.route_id !== toStop.route_id) {
        Alert.alert('Error', 'The selected stops are not on the same route.');
        return;
      }

      if (fromStop.stop_order >= toStop.stop_order) {
        Alert.alert('Error', '"From" stop must come before "To" stop in the route.');
        return;
      }

      // Fetch all waypoints for the route, ordered by stop_order
      const { data: routeWaypoints, error: routeWaypointsError } = await supabase
        .from('stops')
        .select('latitude, longitude, stop_order, name') // Include the name
        .eq('route_id', fromStop.route_id)
        .order('stop_order', { ascending: true });

      if (routeWaypointsError) {
        Alert.alert('Error', 'Failed to fetch route waypoints.');
        return;
      }

      // Function to fetch detailed route between two waypoints
      const getDetailedRoute = async (origin, destination) => {
        try {
          const directionsUrl = `https://maps.gomaps.pro/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=AlzaSykD0-TOgCvku5D5nyYC67DmWk2aaon-COn`;
          const response = await fetch(directionsUrl);
          const directionsData = await response.json();

          if (directionsData.status === 'OK') {
            return decodePolyline(directionsData.routes[0].overview_polyline.points);
          } else {
            console.error('Failed to fetch directions:', directionsData.status);
            return [];
          }
        } catch (error) {
          console.error('Error fetching route:', error);
          return [];
        }
      };

      // Combine detailed routes between each consecutive stop
      let allWaypoints = [];
      for (let i = 0; i < routeWaypoints.length - 1; i++) {
        const origin = { latitude: parseFloat(routeWaypoints[i].latitude), longitude: parseFloat(routeWaypoints[i].longitude) };
        const destination = { latitude: parseFloat(routeWaypoints[i + 1].latitude), longitude: parseFloat(routeWaypoints[i + 1].longitude) };
        const detailedRoute = await getDetailedRoute(origin, destination);
        allWaypoints = [...allWaypoints, ...detailedRoute];
      }

      navigation.navigate('MainTabNavigator', { // Navigate to MainTabNavigator
        screen: 'MapViewScreen', // Specify the MapViewScreen
        params: { // Pass the parameters
          origin: { latitude: parseFloat(fromStop.latitude), longitude: parseFloat(fromStop.longitude) },
          destination: { latitude: parseFloat(toStop.latitude), longitude: parseFloat(toStop.longitude) },
          waypoints: allWaypoints,
          routeWaypoints: routeWaypoints, // Pass the routeWaypoints array
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
      <TouchableOpacity
        style={styles.button}
        onPress={handleUseMyLocation}
        disabled={isLoading} // Disable the button while loading
      >
        <Text style={styles.buttonText}>Use My Location</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={handleSearch}
        disabled={isLoading} // Disable the button while loading
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" /> // Show loading animation
        ) : (
          <Text style={styles.buttonText}>Find Route</Text> // Show button text
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 15,
    padding: 15,
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