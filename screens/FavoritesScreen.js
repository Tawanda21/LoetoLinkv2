import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Dimensions, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MapView from 'react-native-maps';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useFavorite } from '../contexts/FavoriteContext'; // <-- import context

const { width } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 120;
const EXPANDED_HEIGHT = 420;

// --- Custom Popup Component ---
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

const FavoritesScreen = () => {
  const navigation = useNavigation();
  const [favoriteRoutes, setFavoriteRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const animations = useRef([]).current;

  // Popup state
  const [popup, setPopup] = useState({ visible: false, message: '' });

  const { notifyFavoriteChanged } = useFavorite(); // <-- use context

  useFocusEffect(
    React.useCallback(() => {
      const fetchFavorites = async () => {
        setLoading(true);
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            setFavoriteRoutes([]);
            setLoading(false);
            return;
          }

          const { data, error } = await supabase
            .from('user_favorite_routes')
            .select('route_id, combi_routes:route_id (id, route_name, origin, destination, origin_latitude, origin_longitude)')
            .eq('user_id', user.id);

          if (error) {
            console.error('Fetch favorites error:', error);
            Alert.alert('Error', 'Failed to fetch favorites');
            setFavoriteRoutes([]);
          } else {
            setFavoriteRoutes(
              data.map((fav, idx) => ({
                id: fav.combi_routes.id,
                name: fav.combi_routes.route_name,
                origin: fav.combi_routes.origin,
                destination: fav.combi_routes.destination,
                coordinate: {
                  latitude: parseFloat(fav.combi_routes.origin_latitude),
                  longitude: parseFloat(fav.combi_routes.origin_longitude),
                },
              }))
            );
          }
        } catch (err) {
          console.error('Fetch favorites error:', err);
          Alert.alert('Error', 'An unexpected error occurred');
          setFavoriteRoutes([]);
        } finally {
          setLoading(false);
        }
      };

      fetchFavorites();
    }, [])
  );

  useEffect(() => {
    animations.length = favoriteRoutes.length;
    for (let i = 0; i < favoriteRoutes.length; i++) {
      animations[i] = new Animated.Value(COLLAPSED_HEIGHT);
    }
    if (favoriteRoutes.length > 0) {
      setExpandedId(favoriteRoutes[0].id);
      Animated.spring(animations[0], {
        toValue: EXPANDED_HEIGHT,
        tension: 40,
        friction: 8,
        useNativeDriver: false,
      }).start();
    }
  }, [favoriteRoutes.length]);

  const handlePress = (idx, id) => {
    const newExpandedId = expandedId === id ? null : id;
    setExpandedId(newExpandedId);

    favoriteRoutes.forEach((_, i) => {
      Animated.spring(animations[i], {
        toValue: i === idx && newExpandedId !== null ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
        tension: 40,
        friction: 8,
        useNativeDriver: false,
      }).start();
    });
  };

  const handleDeleteFavorite = async (routeId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from('user_favorite_routes')
        .delete()
        .eq('user_id', user.id)
        .eq('route_id', routeId);
        
      if (error) {
        console.error('Delete favorite error:', error);
        Alert.alert('Error', 'Could not remove from favorites');
      } else {
        setFavoriteRoutes(favoriteRoutes.filter(route => route.id !== routeId));
        setPopup({ visible: true, message: 'Removed from favorites!' });
        notifyFavoriteChanged(); // <-- notify HomeScreen
      }
    } catch (err) {
      console.error('Delete favorite error:', err);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  // Example: call this when you add a favorite elsewhere
  const handleAddFavorite = () => {
    setPopup({ visible: true, message: 'Added to favorites!' });
    notifyFavoriteChanged(); // <-- notify HomeScreen
  };

  return (
    <ImageBackground
      source={require('../assets/background.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginLeft: 20, marginBottom: 10 }}>
          <Text style={{ fontFamily: 'jgs', fontSize: 28, color: '#212842', fontWeight: 'bold' }}>
            Favorites
          </Text>
        </View>
        <AnimatedPopup
          visible={popup.visible}
          message={popup.message}
          onHide={() => setPopup({ ...popup, visible: false })}
        />
        {loading ? (
          <ActivityIndicator size="large" color="#018abe" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {favoriteRoutes.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 40, color: '#fff' }}>
                No favorites yet.
              </Text>
            ) : favoriteRoutes.map((item, idx) => {
              const isExpanded = expandedId === item.id;
              return (
                <Animated.View
                  style={[
                    styles.card,
                    { height: animations[idx], overflow: 'hidden' },
                    !isExpanded && styles.cardCollapsed,
                    idx === 0 && styles.firstCard,
                    idx === favoriteRoutes.length - 1 && styles.lastCard,
                  ]}
                  key={item.id}
                >
                  <View style={styles.touchArea}>
                    <View style={styles.headerRow}>
                      <View style={styles.busIconContainer}>
                        <Ionicons name="bus-outline" size={28} color="#018abe" />
                      </View>
                      <Text style={styles.nameText}>{item.name}</Text>
                      <TouchableOpacity onPress={() => handleDeleteFavorite(item.id)} style={{ marginRight: 10 }}>
                        <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handlePress(idx, item.id)} style={{ marginLeft: 22 }}>
                        <MaterialIcons name={isExpanded ? "expand-less" : "expand-more"} size={28} color="#888" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.routeDetailsRow}>
                      <Ionicons name="arrow-back" size={18} color="#018abe" style={{ marginRight: 6 }} />
                      <Text style={styles.detailLabel}>From:</Text>
                      <Text style={styles.detailValue}>{item.origin}</Text>
                    </View>
                    <View style={styles.routeDetailsRow}>
                      <Ionicons name="arrow-forward" size={18} color="#018abe" style={{ marginRight: 6 }} />
                      <Text style={styles.detailLabel}>To:</Text>
                      <Text style={styles.detailValue}>{item.destination}</Text>
                    </View>
                    {isExpanded && (
                      <View style={styles.expandedContent}>
                        <View style={styles.mapContainer}>
                          <MapView
                            style={styles.map}
                            initialRegion={{
                              latitude: item.coordinate.latitude,
                              longitude: item.coordinate.longitude,
                              latitudeDelta: 0.0922,
                              longitudeDelta: 0.0421,
                            }}
                          />
                          <TouchableOpacity 
                            style={styles.routeButton}
                            onPress={() => navigation.navigate('MapViewScreen', { coordinate: item.coordinate })}
                          >
                            <Text style={styles.routeButtonText}>Show Route</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.extraRow}>
                          <Text style={styles.extraLabel}>
                            {item.origin} → {item.destination}
                          </Text>
                          <Ionicons name="share-social-outline" size={20} color="#888" />
                        </View>
                      </View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </ScrollView>
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
    backgroundColor: 'transparent',
    paddingTop: 0,
  },
  scrollContainer: {
    paddingVertical: 0,
    paddingTop: 30,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 2,
    width: width - 32,
    alignSelf: 'center',
  },
  firstCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  lastCard: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  cardCollapsed: {
    opacity: 0.7,
  },
  touchArea: {
    flex: 1,
    padding: 0,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  busIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e6f2fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#018abe',
    flexShrink: 1,
  },
  routeDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginLeft: 4,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#555',
    marginRight: 4,
    fontSize: 15,
  },
  detailValue: {
    color: '#333',
    fontSize: 15,
    flexShrink: 1,
  },
  expandedContent: {
    marginTop: 12,
  },
  mapContainer: {
    height: 150,
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    borderRadius: 10,
  },
  routeButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#2d9cdb',
    padding: 8,
    borderRadius: 5,
  },
  routeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  extraLabel: {
    fontSize: 14,
    color: '#888',
  },
});

export default FavoritesScreen;