import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

const BusStopScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStops, setFilteredStops] = useState([]);
  const [busStops, setBusStops] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchBusStops = async () => {
      const { data, error } = await supabase
        .from('stops')
        .select('*')
        .order('name', { ascending: true }); // Order by name

      if (error) {
        Alert.alert('Error', 'Failed to fetch bus stops.');
        return;
      }

      setBusStops(data);
      setFilteredStops(data); // Initialize filtered stops with all stops
    };

    fetchBusStops();
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = busStops.filter(stop =>
      stop.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredStops(filtered);
  };

  const handleShowRoute = (stop) => {
    // Navigate to MapViewScreen and display the route for the selected stop
    navigation.navigate('Map', {
      origin: { latitude: parseFloat(stop.latitude), longitude: parseFloat(stop.longitude) },
      destination: { latitude: parseFloat(stop.latitude), longitude: parseFloat(stop.longitude) }, // Set destination to the same stop
      waypoints: [{ latitude: parseFloat(stop.latitude), longitude: parseFloat(stop.longitude) }], // Set waypoints to the selected stop
      routeWaypoints: [stop], // Pass the selected stop as a route waypoint
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search bus stops..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        style={styles.table}
        data={filteredStops}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={() => (
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, { flex: 3 }]}>Name</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Actions</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={[styles.cell, { flex: 3 }]}>{item.name}</Text>
            <TouchableOpacity
              style={[styles.routeButton, { flex: 1 }]}
              onPress={() => handleShowRoute(item)}
            >
              <Text style={styles.routeButtonText}>Show Route</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dce2ef',
    padding: 20,
  },
  searchContainer: {
    width: '100%',
    marginBottom: 20,
  },
  searchBar: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  table: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#22303f',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  headerCell: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  cell: {
    fontSize: 16,
  },
  routeButton: {
    backgroundColor: '#22303f',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  routeButtonText: {
    color: 'white',
    fontSize: 14,
  },
});

export default BusStopScreen;