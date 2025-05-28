import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();
  const animation = useRef(null);

  useEffect(() => {
    animation.current?.play();
  }, []);

  const handleAnimationFinish = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <LottieView
        ref={animation}
        source={require('../assets/animations/FinalSplashScreen.json')} // Path to your JSON file
        autoPlay
        loop={false} // Set to false to play the animation only once
        style={styles.lottieAnimation}
        resizeMode="cover"
        onAnimationFinish={handleAnimationFinish}
        imageAssetsFolder={'assets/images'} // Add this line
        speed={7} // Adjust speed as needed
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