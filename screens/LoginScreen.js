import React, { useState, useEffect, useRef } from 'react';
import { Alert, Animated, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, ImageBackground } from 'react-native';
import { supabase } from '../lib/supabase'; // Adjust the import path as necessary
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import CustomPopup from '../components/CustomPopup';

//working perfectly fine

const LoginScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [popup, setPopup] = useState({ visible: false, title: '', message: '', onConfirm: null });

  // Function to handle user login
  const signInWithEmail = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setPopup({
        visible: true,
        title: 'Login Failed',
        message: error.message,
        onConfirm: () => setPopup({ ...popup, visible: false }),
      });
    } else {
      setPopup({
        visible: true,
        title: 'Login Successful',
        message: 'Welcome back!',
        onConfirm: () => {
          setPopup({ ...popup, visible: false });
          navigation.reset({ index: 0, routes: [{ name: 'MainTabNavigator' }] });
        },
      });
    }
  };

  // Function to handle user registration
  const signUpWithEmail = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert('Registration Failed', error.message);
    } else {
      Alert.alert('Registration Successful', 'Please check your email for verification.');
    }
  };

  // Google Sign-In function
  const signInWithGoogle = async () => {
    const redirectUrl = AuthSession.makeRedirectUri({ useProxy: false });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    });

    if (error) {
      Alert.alert('Google Sign-In failed', error.message);
      return;
    }
    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      // After OAuth, Supabase will handle the session.
      // check if user is logged in and navigate:
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabNavigator' }] });
      }
    }
  };

  // Apple Sign-In function (iOS only)
  const signInWithApple = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Apple Sign-In is only available on iOS.');
      return;
    }
    const redirectUrl = AuthSession.makeRedirectUri({ useProxy: false });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: redirectUrl }
    });

    if (error) {
      Alert.alert('Apple Sign-In failed', error.message);
      return;
    }
    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabNavigator' }] });
      }
    }
  };

  // Listen for auth state changes (handles OAuth redirect)
  /*useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabNavigator' }] });
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); */

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

    Animated.loop(Animated.sequence([fadeIn, fadeOut])).start();
  }, []);

  return (
        <ImageBackground
          source={require('../assets/background.jpg')}
          style={styles.backgroundImage}
        >
          <View style={styles.container}>
            <View style={styles.headerContainer}>
              <Text style={styles.logoText}>LoetoLink</Text>
              <Image
                source={require('../assets/logo.jpg')}
                style={styles.splashImage}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.button} onPress={signInWithEmail}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.newButton} onPress={signUpWithEmail}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
    
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.appleButton} onPress={signInWithApple}>
                <Image
                  source={require('../assets/apple-logo.png')}
                  style={styles.appleIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle}>
                <Image
                  source={require('../assets/google-logo.png')}
                  style={[styles.googleIcon, { width: 20, height: 20 }]}
                />
              </TouchableOpacity>
            </View>
    
            <TouchableOpacity
              style={styles.guestButton}
              onPress={() =>
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabNavigator', params: { screen: 'Map' } }],
                })
              }
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
              <Animated.Image
                source={require('../assets/arrow-right.png')}
                style={[styles.arrowIcon, { opacity: fadeAnim }]}
              />
            </TouchableOpacity>
            <Text style={styles.footerText}>
              By continuing you confirm that you agree to our{' '}
              <Text style={styles.link} onPress={() => { }}>
                Terms of Service
              </Text>
              ,{' '}
              <Text style={styles.link} onPress={() => { }}>
                Bus/Combi Policy
              </Text>{' '}
              and good behavior in the bus/combi.
            </Text>
            <CustomPopup
              visible={popup.visible}
              title={popup.title}
              message={popup.message}
              onConfirm={popup.onConfirm}
              onClose={() => setPopup({ ...popup, visible: false })}
            />
          </View>
        </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover', // or 'stretch'
    width: '100%',
    height: '100%',
    justifyContent: 'center', // centers the content vertically
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#transparent',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center', // Center items horizontally
    marginBottom: 20, // Add some space below the logo
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Arial', // Change to a more attractive font
  },
  splashImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5, // Darken the shadow
    shadowRadius: 30, // Increase the shadow radius
    elevation: 5,
    backgroundColor: 'white',
    borderRadius: 15, // Add a borderRadius for rounded corners
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    marginBottom: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  button: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  newButton: {
    backgroundColor: '#808080',
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
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 25,
  },
  appleButton: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 25,
    width: '25%',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
    width: '25%',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  guestButtonText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
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
  },
});

export default LoginScreen;