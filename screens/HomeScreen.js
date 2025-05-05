import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const HomeScreen = (navigation) => {
  return (
    <View style={styles.container}>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#dce2ef',
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dce2ef',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default HomeScreen;