import React, { useState, useEffect, useRef } from 'react';
import { Alert, Animated, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase'; // Adjust the import path as necessary
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signInWithEmail = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert(error.message);
    else navigation.reset({ index: 0, routes: [{ name: 'MainTabNavigator' }] });
  };

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>LoetoLink</Text>
        <Image
          source={require('../assets/logo.jpg')}
          style={styles.splashImage}
        />
      </View>
      <Text style={styles.title}>Welcome!</Text>
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

      <TouchableOpacity style={styles.newButton} onPress={() => {}}>
        <Text style={styles.buttonText}>I'm New</Text>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.appleButton}>
          <Image
            source={require('../assets/apple-logo.png')}
            style={styles.appleIcon}
          />

        </TouchableOpacity>
        <TouchableOpacity style={styles.googleButton}>
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
        <Text style={styles.link} onPress={() => {}}>
          Terms of Service
        </Text>
        ,{' '}
        <Text style={styles.link} onPress={() => {}}>
          Bus/Combi Policy
        </Text>{' '}
        and good behavior in the bus/combi.
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
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 10,
  },
  splashImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
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
    marginRight: 10,
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