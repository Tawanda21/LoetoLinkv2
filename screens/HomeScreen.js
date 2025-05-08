import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import * as Location from 'expo-location';
import haversine from 'haversine-distance';
import UserHeader from '../components/UserHeader';

const HomeScreen = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [stops, setStops] = useState([]);
  const [filteredStops, setFilteredStops] = useState([]);
  const navigation = useNavigation();

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

  const handleInputChange = (text, type) => {
    const filtered = stops.filter((stop) =>
      stop.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredStops(filtered);

    if (type === 'from') setFrom(text);
    else setTo(text);
  };

  const handleSelectStop = (stop, type) => {
    if (type === 'from') setFrom(stop.name);
    else setTo(stop.name);
    setFilteredStops([]);
  };

  const handleSearch = async () => {
    if (!from || !to) {
      Alert.alert('Error', 'Please enter both "From" and "To" stops.');
      return;
    }

    const fromStop = stops.find((stop) => stop.name.toLowerCase() === from.toLowerCase());
    const toStop = stops.find((stop) => stop.name.toLowerCase() === to.toLowerCase());

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

    navigation.navigate('Map', {
      origin: { latitude: fromStop.latitude, longitude: fromStop.longitude },
      destination: { latitude: toStop.latitude, longitude: toStop.longitude },
    });
  };

  const handleUseMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    let nearestStop = null;
    let minDistance = Infinity;

    stops.forEach((stop) => {
      const distance = haversine(
        { latitude, longitude },
        { latitude: stop.latitude, longitude: stop.longitude }
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestStop = stop;
      }
    });

    if (nearestStop) {
      setFrom(nearestStop.name);
      Alert.alert('Nearest Stop', `Nearest stop is ${nearestStop.name}`);
    }
  };

  return (
    <View style={styles.container}>
      <UserHeader />
      <TextInput
        style={styles.input}
        placeholder="From..."
        value={from}
        onChangeText={(text) => handleInputChange(text, 'from')}
      />
      {filteredStops.length > 0 && (
        <FlatList
          style={styles.dropdown}
          data={filteredStops}
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
      <TextInput
        style={styles.input}
        placeholder="To..."
        value={to}
        onChangeText={(text) => handleInputChange(text, 'to')}
      />
      {filteredStops.length > 0 && (
        <FlatList
          style={styles.dropdown}
          data={filteredStops}
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
      <TouchableOpacity style={styles.button} onPress={handleUseMyLocation}>
        <Text style={styles.buttonText}>Use My Location</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>Find Route</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
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
});

export default HomeScreen;