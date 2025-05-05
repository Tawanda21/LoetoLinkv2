import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image } from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity

  useEffect(() => {
    // Start the animation when the component mounts
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome Screen</Text>
      <TouchableOpacity
        style={styles.swipeArrowContainer}
        onPress={() => navigation.navigate('Home')}
      >
        <Animated.View style={[styles.swipeArrow, { opacity: fadeAnim }]}>
          <Image
            source={require('../assets/arrow-right.png')} // Ensure you have an arrow-right image in your assets folder
            style={styles.arrowImage}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  swipeArrowContainer: {
    position: 'absolute',
    bottom: 50,
    right: 20,
  },
  swipeArrow: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowImage: {
    width: 30,
    height: 30,
  },
});

export default WelcomeScreen;