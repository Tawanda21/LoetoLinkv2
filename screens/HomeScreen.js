import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator, ImageBackground, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import * as Location from 'expo-location';
import haversine from 'haversine-distance';
import UserHeader from '../components/UserHeader';
import { decodePolyline } from '../utils';
import { debounce } from 'lodash';
import { Ionicons } from '@expo/vector-icons';
import { useFavorite } from '../contexts/FavoriteContext';

// --- Custom Popup Component (same as FavoritesScreen) ---
const AnimatedPopup = ({ visible, message, onHide }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 1.8s
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 40,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide && onHide();
        });
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        popupStyles.popup,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="none"
    >
      <Text style={popupStyles.popupText}>{message}</Text>
    </Animated.View>
  );
};

const HomeScreen = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [stops, setStops] = useState([]);
  const [filteredFromStops, setFilteredFromStops] = useState([]);
  const [filteredToStops, setFilteredToStops] = useState([]);
  const navigation = useNavigation();
  const [fromStopData, setFromStopData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allStopsAndTerminals, setAllStopsAndTerminals] = useState([]);
  const [currentRouteId, setCurrentRouteId] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [popup, setPopup] = useState({ visible: false, message: '' });

  const { favoriteChanged, notifyFavoriteChanged } = useFavorite();

  // Fetch all stops and terminals ONCE for smooth filtering
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data: stopsData, error: stopsError } = await supabase.from('stops').select('*');
        const { data: routesData, error: routesError } = await supabase.from('combi_routes').select('*');
        if (stopsError || routesError) {
          Alert.alert('Error', 'Failed to fetch stops or routes.');
          return;
        }
        setStops(stopsData);

        // Create terminal entries
        const terminals = [];
        routesData.forEach(route => {
          terminals.push({
            id: `origin-${route.id}`,
            name: route.origin,
            latitude: route.origin_latitude,
            longitude: route.origin_longitude,
            route_id: route.id,
            stop_order: 0,
            isTerminal: true
          });
          terminals.push({
            id: `destination-${route.id}`,
            name: route.destination,
            latitude: route.destination_latitude,
            longitude: route.destination_longitude,
            route_id: route.id,
            stop_order: 999,
            isTerminal: true
          });
        });
        setAllStopsAndTerminals([...stopsData, ...terminals]);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch stops and terminals.');
      }
    };
    fetchAll();
  }, []);

  // Keep currentRouteId in sync with from/to
  useEffect(() => {
    const updateRouteId = async () => {
      if (!from || !to) {
        setCurrentRouteId(null);
        setIsFavorite(false);
        return;
      }
      const { data, error } = await supabase
        .from('combi_routes')
        .select('id')
        .eq('origin', from)
        .eq('destination', to)
        .single();
      if (data && data.id) {
        setCurrentRouteId(data.id);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: favData } = await supabase
            .from('user_favorite_routes')
            .select('id')
            .eq('user_id', user.id)
            .eq('route_id', data.id)
            .single();
          setIsFavorite(!!favData);
        }
      } else {
        setCurrentRouteId(null);
        setIsFavorite(false);
      }
    };
    updateRouteId();
    // eslint-disable-next-line
  }, [from, to]);

  // Re-check favorite status when favoriteChanged or currentRouteId changes
  useEffect(() => {
    const checkIfFavorite = async (routeId) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && routeId) {
        const { data: favData } = await supabase
          .from('user_favorite_routes')
          .select('id')
          .eq('user_id', user.id)
          .eq('route_id', routeId)
          .single();
        setIsFavorite(!!favData);
      }
    };
    if (currentRouteId) {
      checkIfFavorite(currentRouteId);
    }
  }, [favoriteChanged, currentRouteId]);

  // Debounced filter function for smooth UX
  const debouncedFilter = useRef(
    debounce((text, type, fromStopDataRef, allStopsAndTerminalsRef) => {
      if (!text.trim()) {
        type === 'from' ? setFilteredFromStops([]) : setFilteredToStops([]);
        return;
      }
      let filtered = allStopsAndTerminalsRef.filter(stop =>
        stop.name.toLowerCase().includes(text.toLowerCase())
      );
      // If filtering "to", restrict to same route as "from"
      if (type === 'to' && fromStopDataRef) {
        filtered = filtered.filter(stop => stop.route_id === fromStopDataRef.route_id);
      }
      if (type === 'from') {
        setFilteredFromStops(filtered);
      } else {
        setFilteredToStops(filtered);
      }
    }, 200)
  ).current;

  const handleInputChange = (text, type) => {
    if (type === 'from') setFrom(text);
    else setTo(text);
    debouncedFilter(
      text,
      type,
      fromStopData,
      allStopsAndTerminals
    );
  };

  const handleSelectStop = (stop, type) => {
    if (type === 'from') {
      setFrom(stop.name);
      setFromStopData(stop);
      setFilteredFromStops([]);
      setTo('');
      setFilteredToStops([]);
    } else {
      setTo(stop.name);
      setFilteredToStops([]);
    }
  };

  const clearFrom = () => {
    setFrom('');
    setFilteredFromStops([]);
    setFromStopData(null);
    setTo('');
    setFilteredToStops([]);
  };
  const clearTo = () => {
    setTo('');
    setFilteredToStops([]);
  };

  const handleSwapStops = async () => {
    const tempFrom = from;
    const tempTo = to;

    // Find the stop data for the "To" stop in allStopsAndTerminals
    const toStopData = allStopsAndTerminals.find(stop => stop.name === tempTo);

    setFrom(tempTo);
    setTo(tempFrom);
    setFromStopData(toStopData || null);
    setFilteredFromStops([]);
    setFilteredToStops([]);
  };

  const handleSearch = async () => {
    if (!from || !to) {
      Alert.alert('Error', 'Please enter both "From" and "To" stops.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Find the correct route_id for the selected direction
      let routeData, routeError;
      // If both from and to are terminals, use combi_routes to find the matching direction
      if (
        allStopsAndTerminals.find(stop => stop.name === from && stop.isTerminal) &&
        allStopsAndTerminals.find(stop => stop.name === to && stop.isTerminal)
      ) {
        const { data, error } = await supabase
          .from('combi_routes')
          .select('*')
          .eq('origin', from)
          .eq('destination', to)
          .single();
        routeData = data;
        routeError = error;
      } else {
        // Otherwise, fallback to using the route_id of the from stop
        const fromStopDataObj = allStopsAndTerminals.find(stop => stop.name === from);
        if (!fromStopDataObj) {
          Alert.alert('Error', 'Invalid "From" stop.');
          setIsLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('combi_routes')
          .select('*')
          .eq('id', fromStopDataObj.route_id)
          .single();
        routeData = data;
        routeError = error;
      }

      if (routeError || !routeData) {
        Alert.alert('Error', 'Could not find a route for the selected direction.');
        setIsLoading(false);
        return;
      }

      // Set the current route ID
      setCurrentRouteId(routeData.id);

      // Check if this route is already a favorite for the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: favData } = await supabase
          .from('user_favorite_routes')
          .select('id')
          .eq('user_id', user.id)
          .eq('route_id', routeData.id)
          .single();
        setIsFavorite(!!favData);
      }

      // 2. Now fetch stops for this route_id
      const { data: routeWaypoints, error: routeWaypointsError } = await supabase
        .from('stops')
        .select('latitude, longitude, stop_order, name, route_id')
        .eq('route_id', routeData.id)
        .order('stop_order', { ascending: true });

      if (routeWaypointsError) {
        Alert.alert('Error', 'Failed to fetch route waypoints.');
        setIsLoading(false);
        return;
      }

      // 3. Build the full stops+terminals array for this direction
      const allStopsWithTerminals = [
        {
          latitude: parseFloat(routeData.origin_latitude),
          longitude: parseFloat(routeData.origin_longitude),
          name: routeData.origin,
          stop_order: 0,
          isTerminal: true,
          route_id: routeData.id,
        },
        ...routeWaypoints,
        {
          latitude: parseFloat(routeData.destination_latitude),
          longitude: parseFloat(routeData.destination_longitude),
          name: routeData.destination,
          stop_order: 999,
          isTerminal: true,
          route_id: routeData.id,
        }
      ];

      // 4. Find indexes for from/to in this direction (match both name and route_id for uniqueness)
      const fromIdx = allStopsWithTerminals.findIndex(
        stop => stop.name === from && stop.route_id === routeData.id
      );
      const toIdx = allStopsWithTerminals.findIndex(
        stop => stop.name === to && stop.route_id === routeData.id
      );

      if (fromIdx === -1 || toIdx === -1) {
        Alert.alert('Error', 'Could not find both stops in the route.');
        setIsLoading(false);
        return;
      }

      // 5. Slice the waypoints in the correct direction
      let completeWaypoints;
      if (fromIdx <= toIdx) {
        completeWaypoints = allStopsWithTerminals.slice(fromIdx, toIdx + 1);
      } else {
        completeWaypoints = allStopsWithTerminals.slice(toIdx, fromIdx + 1).reverse();
      }

      if (!completeWaypoints || completeWaypoints.length < 2) {
        Alert.alert('Error', 'Insufficient waypoints to create a route.');
        setIsLoading(false);
        return;
      }

      // 6. Prepare origin/destination objects for navigation
      const origin = {
        latitude: parseFloat(completeWaypoints[0].latitude),
        longitude: parseFloat(completeWaypoints[0].longitude)
      };
      const destination = {
        latitude: parseFloat(completeWaypoints[completeWaypoints.length - 1].latitude),
        longitude: parseFloat(completeWaypoints[completeWaypoints.length - 1].longitude)
      };

      // Replace the existing waypoints generation code
      const getDetailedRoute = async (waypoints) => {
        try {
          if (!waypoints || waypoints.length < 2) {
            Alert.alert("Error", "Insufficient waypoints to create a route.");
            return null;
          }

          // Validate waypoints
          for (const wp of waypoints) {
            if (!wp || typeof wp.latitude !== 'number' || typeof wp.longitude !== 'number') {
              Alert.alert("Error", "Invalid waypoint data.");
              return null;
            }
          }

          const waypointsStr = waypoints
            .map(wp => `${wp.latitude},${wp.longitude}`)
            .join('|');

          const directionsUrl = `https://maps.gomaps.pro/maps/api/directions/json?` +
            `origin=${waypoints[0].latitude},${waypoints[0].longitude}&` +
            `destination=${waypoints[waypoints.length-1].latitude},${waypoints[waypoints.length-1].longitude}&` +
            `waypoints=optimize:false|${waypointsStr}&` +
            `mode=driving&` +
            `alternatives=true&` +
            `avoid=highways|ferries&` +
            `key=AlzaSy0csWCFtrxT-TmMw4adcHN41jNcy0mdvdf`;

          const response = await fetch(directionsUrl);
          const directionsData = await response.json();

          if (directionsData.status === 'OK') {
            const routes = directionsData.routes;
            let shortestRoute = routes[0];
            let shortestDistance = Number.MAX_VALUE;

            routes.forEach(route => {
              const distance = route.legs.reduce((total, leg) => total + leg.distance.value, 0);
              if (distance < shortestDistance) {
                shortestDistance = distance;
                shortestRoute = route;
              }
            });

            return decodePolyline(shortestRoute.overview_polyline.points);
          } else {
            Alert.alert('No Route Found', 'No route could be found for the selected stops. Please try different stops.');
            return null;
          }
        } catch (error) {
          Alert.alert('Error', 'An error occurred while fetching the route.');
          return null;
        }
      };

      const allWaypoints = await getDetailedRoute(completeWaypoints);

      if (!allWaypoints || allWaypoints.length === 0) {
        setIsLoading(false);
        return;
      }

      navigation.navigate('MainTabNavigator', {
        screen: 'MapViewScreen',
        params: {
          origin,
          destination,
          waypoints: allWaypoints,
          routeWaypoints: completeWaypoints,
          route_name: routeData?.route_name || routeData?.name,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseMyLocation = async () => {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      if (canAskAgain) {
        const { status: requestStatus } = await Location.requestForegroundPermissionsAsync();
        if (requestStatus !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
          return;
        }
      } else {
        Alert.alert('Permission Denied', 'Location permission is not enabled. Please enable it in your device settings.');
        return;
      }
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      let nearestStop = null;
      let minDistance = Infinity;

      stops.forEach((stop) => {
        const stopLat = Number(stop.latitude);
        const stopLng = Number(stop.longitude);
        const distance = haversine(
          { latitude: Number(latitude), longitude: Number(longitude) },
          { latitude: stopLat, longitude: stopLng }
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestStop = stop;
        }
      });

      if (nearestStop) {
        setFrom(nearestStop.name);
        setFromStopData(nearestStop);
        setFilteredFromStops([]);
        setTo('');
        setFilteredToStops([]);
        Alert.alert(
          'Nearest Stop',
          `Your location:\nLat: ${latitude}\nLng: ${longitude}\n\nNearest stop: ${nearestStop.name}\nLat: ${nearestStop.latitude}\nLng: ${nearestStop.longitude}\n\nDistance: ${(minDistance / 1000).toFixed(2)} km`
        );
      } else {
        Alert.alert('No Stops Found', 'Could not find any stops nearby.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location.');
    }
  };

  const handleFavoritePress = async () => {
    setFavoriteLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setPopup({ visible: true, message: 'You must be logged in to save favorites.' });
        setFavoriteLoading(false);
        return;
      }

      if (isFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from('user_favorite_routes')
          .delete()
          .eq('user_id', user.id)
          .eq('route_id', currentRouteId);

        if (error) {
          console.error('Delete favorite error:', error);
          setPopup({ visible: true, message: 'Could not remove from favorites.' });
        } else {
          setIsFavorite(false);
          notifyFavoriteChanged();
          setPopup({ visible: true, message: 'Route removed from favorites!' });
        }
      } else {
        // Add favorite - check if it already exists first
        const { data: existingFav } = await supabase
          .from('user_favorite_routes')
          .select('id')
          .eq('user_id', user.id)
          .eq('route_id', currentRouteId);

        if (existingFav && existingFav.length > 0) {
          setPopup({ visible: true, message: 'This route is already in your favorites.' });
        } else {
          // Insert new favorite
          const { error } = await supabase
            .from('user_favorite_routes')
            .insert([{ user_id: user.id, route_id: currentRouteId }]);

          if (error) {
            console.error('Add favorite error:', error);
            setPopup({ visible: true, message: 'Could not add to favorites.' });
          } else {
            setIsFavorite(true);
            notifyFavoriteChanged();
            setPopup({ visible: true, message: 'Route added to favorites!' });
          }
        }
      }
    } catch (err) {
      console.error('Favorite action error:', err);
      setPopup({ visible: true, message: 'An unexpected error occurred.' });
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/background.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <AnimatedPopup
          visible={popup.visible}
          message={popup.message}
          onHide={() => setPopup({ ...popup, visible: false })}
        />
        <UserHeader onAvatarPress={() => navigation.navigate('Profile')} />
        <View style={styles.inputContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="From..."
              value={from}
              onChangeText={(text) => handleInputChange(text, 'from')}
            />
            {from.length > 0 && (
              <TouchableOpacity onPress={clearFrom} style={{ marginLeft: -35, zIndex: 1 }}>
                <Text style={{ fontSize: 18, color: '#888' }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {filteredFromStops.length > 0 && (
            <FlatList
              style={styles.dropdown}
              data={filteredFromStops}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleSelectStop(item, 'from')}
                >
                  <Text>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
        <View style={styles.inputContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="To..."
              value={to}
              onChangeText={(text) => handleInputChange(text, 'to')}
              editable={from !== ''}
            />
            {to.length > 0 && (
              <TouchableOpacity onPress={clearTo} style={{ marginLeft: -35, zIndex: 1 }}>
                <Text style={{ fontSize: 18, color: '#888' }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {filteredToStops.length > 0 && (
            <FlatList
              style={styles.dropdown}
              data={filteredToStops}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleSelectStop(item, 'to')}
                >
                  <Text>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleSearch} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Search</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleUseMyLocation}>
          <Text style={styles.buttonText}>Use My Location</Text>
        </TouchableOpacity>
        {currentRouteId && (
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: isFavorite ? '#e74c3c' : '#27ae60' }
            ]}
            onPress={handleFavoritePress}
            disabled={favoriteLoading}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.buttonText}>
                {favoriteLoading
                  ? 'Saving...'
                  : isFavorite
                  ? 'Remove from Favorites'
                  : 'Add to Favorites'}
              </Text>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color="#fff"
                style={{ marginLeft: 8 }}
              />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </ImageBackground>
  );
};

const popupStyles = StyleSheet.create({
  popup: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: '#018abe',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  popupText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 15,
    paddingHorizontal: 15,
    backgroundColor: 'white',
  },
  dropdown: {
    maxHeight: 150,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  button: {
    backgroundColor: '#018abe',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  swapButton: {
    backgroundColor: '#018abe',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    alignSelf: 'center',
  },
  swapButtonText: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
  },
});

export default HomeScreen;