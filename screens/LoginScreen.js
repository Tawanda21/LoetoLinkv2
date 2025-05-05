import React, { useEffect, useRef } from 'react';
import { Image, Animated } from 'react-native';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fadeIn = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    });
    const fadeOut = Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1500,
      useNativeDriver: true,
    });

    Animated.loop(
      Animated.sequence([fadeIn, fadeOut])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>LoetoLink</Text>
      </View>
      <Image
              source={require('../assets/logo.jpg')}
              style={[styles.splashImage, { width: 100, height: 100, resizeMode: 'contain' }]}
            />
      <Text style={styles.title}>Welcome!</Text>
      <TouchableOpacity style={styles.appleButton}>
      <Image
          source={require('../assets/apple-logo.png')}
          style={styles.appleIcon}
        />
        <Text style={styles.appleButtonText}>Sign up with Apple</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.googleButton}>
      <Image
          source={require('../assets/google-logo.png')}
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>Sign up with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>I already have an account</Text>
      </TouchableOpacity>
      <View style={{ height: 25 }} />

      <TouchableOpacity
        style={styles.guestButton} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabNavigator', params: { screen: 'Map' } }], })}>
        <Text style={styles.guestButtonText}>Continue as Guest</Text>
        <Animated.Image
          source={require('../assets/arrow-right.png')}
          style={[styles.arrowIcon, { opacity: fadeAnim }]}
        />
      </TouchableOpacity>
      <Text style={styles.footerText}>
        By continuing you confirm that you agree to our{' '}
        <Text style={styles.link} onPress={() => {}}>Terms of Service</Text>, {' '}
        <Text style={styles.link} onPress={() => {}}>Bus/Combi Policy</Text> and good behavior in the bus/combi.
      </Text>
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
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    alignSelf: 'flex-start',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
  highlight: {
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  appleButton: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  googleButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  guestButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 25,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  guestButtonText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
    marginRight: 10,
  },
  appleButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  googleButtonText: {
    color: '#000',
    textAlign: 'center',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#204ECF',
    padding: 10,
    borderRadius: 25,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  appleIcon: {
    width: 20,
    height: 20,
    marginRight: 171,
    marginBottom: -21,
    tintColor: '#fff',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 171,
    marginBottom: -21,
  },
  arrowIcon: {
    width: 20,
    height: 20,
  },
  footerText: {
    position: 'absolute',
    bottom: 35,
    textAlign: 'center',
    fontSize: 12,
    color: 'gray',
    paddingHorizontal: 20,
  },
  link: {
    textDecorationLine: 'underline',
    color: 'blue',
  }
});

export default LoginScreen;