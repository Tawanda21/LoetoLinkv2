import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase'; // Ensure this path is correct

const HomeScreen = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const navigation = useNavigation();

  const handleSearch = async () => {
    if (!from || !to) {
      Alert.alert('Error', 'Please enter both "From" and "To" stops.');
      return;
    }

    try {
      // Fetch stops from Supabase
      const { data: stops, error: stopsError } = await supabase.from('stops').select('*');
      if (stopsError) throw stopsError;

      // Find the "from" and "to" stops
      const fromStop = stops.find((stop) => stop.name.toLowerCase() === from.toLowerCase());
      const toStop = stops.find((stop) => stop.name.toLowerCase() === to.toLowerCase());

      if (!fromStop || !toStop) {
        Alert.alert('Error', 'One or both stops not found.');
        return;
      }

      // Ensure the stops are on the same route and in the correct order
      if (fromStop.route_id !== toStop.route_id) {
        Alert.alert('Error', 'The selected stops are not on the same route.');
        return;
      }
      if (fromStop.stop_order >= toStop.stop_order) {
        Alert.alert('Error', '"From" stop must come before "To" stop in the route.');
        return;
      }

      // Navigate to MapViewScreen with route details
      navigation.navigate('Map', {
        origin: { latitude: fromStop.latitude, longitude: fromStop.longitude },
        destination: { latitude: toStop.latitude, longitude: toStop.longitude },
      });
    } catch (error) {
      Alert.alert('Error', 'An error occurred while fetching the route.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="From..."
        value={from}
        onChangeText={setFrom}
      />
      <TextInput
        style={styles.input}
        placeholder="To..."
        value={to}
        onChangeText={setTo}
      />
      <Button title="Find Route" onPress={handleSearch} />
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
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
});

export default HomeScreen;