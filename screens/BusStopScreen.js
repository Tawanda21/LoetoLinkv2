import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import Button from '../components/Button';

const BusStopScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStops, setFilteredStops] = useState([]);
  
  // Example bus stops data - replace with your actual data
  const busStops = [
    { id: '1', name: 'Gamecity bus stop' },
    { id: '2', name: 'Apex bus stop' },
    { id: '3', name: 'BAC bus stop' },
    // Add more bus stops as needed
  ];

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = busStops.filter(stop =>
      stop.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredStops(filtered);
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
        {searchQuery.length > 0 && (
          <FlatList
            style={styles.dropdown}
            data={filteredStops}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.dropdownItemContainer}>
                <Text style={styles.dropdownItem}>{item.name}</Text>
                <TouchableOpacity style={styles.routeButton}>
                  <Text style={styles.routeButtonText}>Show Route</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

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
    marginBottom: 5,
  },
  dropdown: {
    backgroundColor: 'white',
    maxHeight: 200,
    borderRadius: 10,
  },
  dropdownItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItem: {
    flex: 1,
  },
  routeButton: {
    backgroundColor: '#22303f',
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  routeButtonText: {
    color: 'white',
    fontSize: 12,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  button: {
    borderRadius: 50,
  },
});

export default BusStopScreen;