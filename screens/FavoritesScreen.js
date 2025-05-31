import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MapView from 'react-native-maps';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase'; // Use the correct client

const { width } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 120;
const EXPANDED_HEIGHT = 420;

const FavoritesScreen = () => {
  const navigation = useNavigation();
  const [favoriteRoutes, setFavoriteRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const animations = useRef([]).current;

  // Fetch user's favorite routes from Supabase
  useFocusEffect(
    React.useCallback(() => {
      const fetchFavorites = async () => {
        setLoading(true);
        try {
          // Get the logged-in user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            setFavoriteRoutes([]);
            setLoading(false);
            return;
          }

          // Fetch user's favorite routes, joining to combi_routes for details
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

  // Reset animations when favorites change
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

  // Add this function inside your FavoritesScreen component
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
        // Update the local state to remove this item
        setFavoriteRoutes(favoriteRoutes.filter(route => route.id !== routeId));
        Alert.alert('Success', 'Route removed from favorites');
      }
    } catch (err) {
      console.error('Delete favorite error:', err);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#018abe" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {favoriteRoutes.length === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
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
                    <Ionicons name="bus-outline" size={36} color="#333" />
                    <Text style={styles.nameText}>{item.name}</Text>
                    <TouchableOpacity onPress={() => handleDeleteFavorite(item.id)} style={{marginRight: 10}}>
                      <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handlePress(idx, item.id)}>
                      <MaterialIcons name={isExpanded ? "expand-less" : "expand-more"} size={28} color="#888" />
                    </TouchableOpacity>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fa',
  },
  scrollContainer: {
    paddingVertical: 0,
    paddingTop: 40,
  },
  card: {
    width: width,
    backgroundColor: '#fff',
    marginVertical: 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 0,
    elevation: 2,
  },
  firstCard: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  lastCard: {
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  cardCollapsed: {
    opacity: 0.7,
  },
  touchArea: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
    color: '#222',
  },
  expandedContent: {
    marginTop: 12,
  },
  mapContainer: {
    height: 150,
    marginBottom: 10,
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