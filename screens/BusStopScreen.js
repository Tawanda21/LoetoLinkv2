import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Animated, ImageBackground } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Place your image in the assets folder and update the path below
const backgroundImage = require('../assets/background.jpg'); // Rename your image to busstop-bg.jpg and put it in assets

const BusStopScreen = () => {
  const [routes, setRoutes] = useState([]);
  const [allStops, setAllStops] = useState([]);
  const [expandedRouteId, setExpandedRouteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const animations = useRef({}).current;

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [{ data: routesData, error: routesError }, { data: stopsData, error: stopsError }] = await Promise.all([
          supabase.from('combi_routes').select('*').order('route_name', { ascending: true }),
          supabase.from('stops').select('*').order('stop_order', { ascending: true }),
        ]);
        if (routesError || stopsError) {
          Alert.alert('Error', 'Failed to fetch routes or stops.');
          return;
        }
        setRoutes(routesData);
        setAllStops(stopsData);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleToggleExpand = (routeId) => {
    if (expandedRouteId === routeId) {
      // Collapse
      if (animations[routeId]) {
        Animated.timing(animations[routeId], {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start(() => setExpandedRouteId(null));
      } else {
        setExpandedRouteId(null);
      }
    } else {
      // Expand
      if (!animations[routeId]) {
        animations[routeId] = new Animated.Value(0);
      }
      setExpandedRouteId(routeId);
      Animated.timing(animations[routeId], {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  };

  const renderStops = (routeId) => {
    const stops = allStops.filter(stop => stop.route_id === routeId);
    if (!animations[routeId]) {
      animations[routeId] = new Animated.Value(0);
    }
    const maxHeight = stops.length * 40 + 20; // estimate height

    return (
      <Animated.View
        style={[
          styles.stopsContainer,
          {
            overflow: 'hidden',
            height: animations[routeId].interpolate({
              inputRange: [0, 1],
              outputRange: [0, maxHeight],
            }),
            opacity: animations[routeId],
          },
        ]}
      >
        {stops.map((stop) => (
          <View key={stop.id} style={styles.stopRow}>
            <Text style={styles.stopOrder}>{stop.stop_order}.</Text>
            <Text style={styles.stopName}>{stop.name}</Text>
          </View>
        ))}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#018abe" />
      </View>
    );
  }

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />
      <FlatList
        data={routes}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.routeCard}>
            <View style={styles.routeHeaderRow}>
              <View style={styles.busIconContainer}>
                <MaterialCommunityIcons name="bus" size={36} color="#018abe" />
              </View>
              <Text style={styles.routeTitle}>{item.route_name}</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.priceText}><Text style={{ fontWeight: 'bold' }}>P7.00</Text></Text>
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
            <TouchableOpacity
              style={styles.dropdownToggle}
              onPress={() => handleToggleExpand(item.id)}
            >
              <Text style={styles.dropdownToggleText}>
                {expandedRouteId === item.id ? 'Hide Stops' : 'Show Stops'}
              </Text>
              <Ionicons
                name={expandedRouteId === item.id ? 'chevron-up' : 'chevron-down'}
                size={22}
                color="#018abe"
              />
            </TouchableOpacity>
            {(expandedRouteId === item.id) && renderStops(item.id)}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 30, paddingTop: 30 }}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 0,
  },
  routeCard: {
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
  },
  routeHeaderRow: {
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
  routeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#018abe',
    flexShrink: 1,
  },
  priceText: {
    fontSize: 16,
    color: '#222',
    marginLeft: 10,
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
  dropdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 2,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#018abe11',
  },
  dropdownToggleText: {
    color: '#018abe',
    fontWeight: 'bold',
    marginRight: 4,
    fontSize: 15,
  },
  stopsContainer: {
    paddingHorizontal: 8,
    paddingBottom: 6,
    backgroundColor: '#f5f6fa',
    marginTop: 6,
    borderRadius: 8,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  stopOrder: {
    width: 28,
    color: '#888',
    fontWeight: 'bold',
  },
  stopName: {
    fontSize: 16,
    color: '#333',
  },
});

export default BusStopScreen;