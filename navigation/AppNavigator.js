import React, { useState, useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Animated, TouchableOpacity, View, StyleSheet } from 'react-native';
import { CardStyleInterpolators } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';

// Auth Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';

// Main App Screens
import HomeScreen from '../screens/HomeScreen';
import MapViewScreen from '../screens/MapViewScreen';
import BusStopScreen from '../screens/BusStopScreen';
import TransportInfoScreen from '../screens/TransportInfoScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const NAV_ICONS = [
  { name: 'home', screen: 'Home', component: HomeScreen },
  { name: 'map', screen: 'MapViewScreen', component: MapViewScreen },
  { name: 'bus', screen: 'Bus Stops', component: BusStopScreen },
  { name: 'information-circle', screen: 'Transport', component: TransportInfoScreen },
  { name: 'heart', screen: 'Favorites', component: FavoritesScreen },
  { name: 'person', screen: 'Profile', component: ProfileScreen },
];

// Floating animated navigation bar
const FloatingNavBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  const animateNavBar = (toValue) => {
    Animated.timing(anim, {
      toValue,
      duration: 350,
      useNativeDriver: false,
    }).start();
  };

  const fadeIcons = (toValue) => {
    Animated.timing(iconOpacity, {
      toValue,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  };

  const resetIcons = () => {
    iconOpacity.setValue(1);
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };

const collapse = () => {
  setExpanded(false);
  animateNavBar(0);
  // Do NOT call resetIcons() here!
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
};

const toggle = () => {
  if (!expanded) {
    setExpanded(true);
    animateNavBar(1);
    resetIcons(); // Only reset opacity when expanding
    if (timerRef.current) clearTimeout(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    // Start fade-out 8 seconds after expanding (so icons fade for 2 seconds before collapse)
    fadeTimerRef.current = setTimeout(() => {
      fadeIcons(0);
    }, 8000);

    timerRef.current = setTimeout(() => {
      collapse();
    }, 10000); // 10 seconds
  } else {
    collapse();
  }
};

// ...existing code...

  const navigateToScreen = (screen) => {
    collapse();
    if (route.name === screen) return; // Already on the target screen
    if (NAV_ICONS.some(icon => icon.screen === route.name)) {
      navigation.navigate(screen); // Already in tab navigator
    } else {
      navigation.navigate('MainTabNavigator', { screen });
    }
  };

  // Clean up timers on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  // Animate width and borderRadius
  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [64, 340],
  });
  const borderRadius = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [32, 28],
  });

  return (
    <Animated.View
      style={[
        navStyles.container,
        {
          width,
          borderRadius,
          backgroundColor: 'rgba(34,48,63,0.95)',
        },
      ]}
      pointerEvents="box-none"
    >
      {expanded ? (
        <Animated.View style={[navStyles.iconRow, { opacity: iconOpacity }]}>
          {NAV_ICONS.map((icon) => (
            <TouchableOpacity
              key={icon.screen}
              style={navStyles.iconButton}
              onPress={() => navigateToScreen(icon.screen)}
            >
              <Ionicons
                name={icon.name + (route.name === icon.screen ? '' : '-outline')}
                size={28}
                color={route.name === icon.screen ? '#acd4fd' : '#fff'}
              />
            </TouchableOpacity>
          ))}
        </Animated.View>
      ) : (
        <TouchableOpacity style={navStyles.homeButton} onPress={toggle}>
          <Ionicons 
            name={route.name === 'Home' ? 'home' : 'home-outline'} 
            size={32} 
            color="#fff" 
          />
        </TouchableOpacity>
      )}
      {/* Removed the close (X) button */}
    </Animated.View>
  );
};

const navStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    paddingHorizontal: 12,
  },
  iconRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 2,
  },
});

// Main tab navigator for the app
const MainTabNavigator = () => {
  return (
    <>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}
      >
        {NAV_ICONS.map((icon) => (
          <Tab.Screen
            key={icon.screen}
            name={icon.screen}
            component={icon.component}
          />
        ))}
      </Tab.Navigator>
      <FloatingNavBar />
    </>
  );
};

// Auth stack navigator
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
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
    setTimeout(() => {
      setIsLoading(false);
      setIsAuthenticated(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
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