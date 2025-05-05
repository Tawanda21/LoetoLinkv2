import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const FavoritesScreen = ({ navigation }) => {
  const favorites = [
    { id: '1', name: 'Route 1' },
    { id: '2', name: 'Route 2' },
    { id: '3', name: 'Route 3' },
    { id: '4', name: 'Route 4' },
  ];

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardText}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Favorites Screen</Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dce2ef',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    width: '48%',
    aspectRatio: 1,
    margin: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
  },
  listContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
});

export default FavoritesScreen;