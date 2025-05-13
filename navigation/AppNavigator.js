import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { CardStyleInterpolators } from '@react-navigation/stack';


// Auth Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';

// Main App Screens
import HomeScreen from '../screens/HomeScreen';
import MapViewScreen from '../screens/MapViewScreen';
import BusStopScreen from '../screens/BusStopScreen';
import TransportInfoScreen from '../screens/TransportInfoScreen';
import MostUsedScreen from '../screens/MostUsedScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main tab navigator for the app
const MainTabNavigator = () => {
  const tabBarAnimation = new Animated.Value(1);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Ensure no header is shown
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Bus Stops') {
            iconName = focused ? 'bus' : 'bus-outline';
          } else if (route.name === 'Transport') {
            iconName = focused ? 'information-circle' : 'information-circle-outline';
          } else if (route.name === 'Most Used') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#acd4fd',
        tabBarInactiveTintColor: '#fff',
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          height: 60,
          paddingBottom: 9,
          paddingTop: 8,
          backgroundColor: 'black',
          left: '15%',
          right: '15%',
          bottom: 20,
          borderRadius: 25,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          margin: 20,
        },
        tabBarHideOnKeyboard: false,
        animationEnabled: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapViewScreen} />
      <Tab.Screen name="Bus Stops" component={BusStopScreen} />
      <Tab.Screen name="Transport" component={TransportInfoScreen} />
      <Tab.Screen name="Most Used" component={MostUsedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Auth stack navigator
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Ensure no header is shown
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        presentation: 'card',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainTabNavigator" component={MainTabNavigator} />
    </Stack.Navigator>
  );
};

// Root navigator that handles auth flow
const RootNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking authentication status
    setTimeout(() => {
      setIsLoading(false);
      // For development, you can set this to true to skip login
      setIsAuthenticated(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Ensure no header is shown
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        presentation: 'card',
        animation: 'slide_from_right',
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen name="MainTabNavigator" component={MainTabNavigator} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="MainTabNavigator" component={MainTabNavigator} />
          <Stack.Screen name="Map" component={MapViewScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

// Main app navigator with navigation container
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;