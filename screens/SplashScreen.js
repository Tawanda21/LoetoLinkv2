import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    
    setTimeout(() => {
      navigation.navigate('Login');
    }, 10000); // 10 seconds delay for the splash screen
  }, [navigation]);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/animations/FinalSplashScreen.json')} // Path to your JSON file
        autoPlay
        loop
        speed={5} //the speed
        style={styles.lottieAnimation}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },});

export default SplashScreen;