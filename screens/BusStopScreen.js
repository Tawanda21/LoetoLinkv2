import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../components/Button';

const BusStopScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bus Stop Screen</Text>
      <Button title="Show Route" onPress={() => navigation.navigate('MapView')} color="#364fa1" style={styles.button} />
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
  },
  button: {
    borderRadius: 50,
  },
});

export default BusStopScreen;