import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MapView from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { db } from '../lib/supabase'; // Make sure this path is correct
import { ActivityIndicator, Alert } from 'react-native';

const CARD_DATA = [
  { id: 1, name: 'Route A', coordinate: { latitude: -24.6282, longitude: 25.9231 } },
  { id: 2, name: 'Route B', coordinate: { latitude: -24.6282, longitude: 25.9231 } },
  { id: 3, name: 'Route C', coordinate: { latitude: -24.6282, longitude: 25.9231 } },
  { id: 4, name: 'Route D', coordinate: { latitude: -24.6282, longitude: 25.9231 } },
  { id: 5, name: 'Route E', coordinate: { latitude: -24.6282, longitude: 25.9231 } },
];

const { width } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 120;
const EXPANDED_HEIGHT = 420;

const FavoritesScreen = () => {
  const navigation = useNavigation();
  const [expandedId, setExpandedId] = useState(CARD_DATA[0].id);
  const animations = useRef(
    CARD_DATA.map(() => new Animated.Value(COLLAPSED_HEIGHT))
  ).current;

  React.useEffect(() => {
    Animated.spring(animations[0], {
      toValue: EXPANDED_HEIGHT,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, []);

  const handlePress = (idx, id) => {
    const newExpandedId = expandedId === id ? null : id;
    setExpandedId(newExpandedId);
    
    CARD_DATA.forEach((_, i) => {
      Animated.spring(animations[i], {
        toValue: i === idx && newExpandedId !== null ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
        tension: 40,
        friction: 8,
        useNativeDriver: false,
      }).start();
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {CARD_DATA.map((item, idx) => {
          const isExpanded = expandedId === item.id;
          return (
            <Animated.View
              style={[
                styles.card,
                { height: animations[idx], overflow: 'hidden' },
                !isExpanded && styles.cardCollapsed,
                idx === 0 && styles.firstCard,
                idx === CARD_DATA.length - 1 && styles.lastCard,
              ]}
              key={item.id}
            >
              <View style={styles.touchArea}>
                <View style={styles.headerRow}>
                  <Ionicons name="bus-outline" size={36} color="#333" />
                  <Text style={styles.nameText}>{item.name}</Text>
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
                      >
                      </MapView>
                      <TouchableOpacity 
                        style={styles.routeButton}
                        onPress={() => navigation.navigate('MapViewScreen', { coordinate: item.coordinate })}
                      >
                        <Text style={styles.routeButtonText}>Show Route</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.extraRow}>
                      <Text style={styles.extraLabel}>Route shared to 1 friend</Text>
                      <Ionicons name="share-social-outline" size={20} color="#888" />
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
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