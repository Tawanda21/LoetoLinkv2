import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';

const MostUsedScreen = () => {
  const navigation = useNavigation();
  const [expandedId, setExpandedId] = useState(null);
  const [animations, setAnimations] = useState({});

const mostUsed = [
  { 
    id: '1', 
    name: 'Route 1 & 2',
    description: 'Popular commuter route through downtown',
    coordinates: {
      latitude: -24.6581, // Gaborone latitude
      longitude: 25.9122, // Gaborone longitude
    }
  },
  { 
    id: '2', 
    name: 'Route 3 & 4',
    description: 'Express route to shopping district',
    coordinates: {
      latitude: -24.6581, // Gaborone latitude
      longitude: 25.9122, // Gaborone longitude
    }
  },
];

  useEffect(() => {
    const initialAnimations = {};
    mostUsed.forEach(item => {
      initialAnimations[item.id] = new Animated.Value(0);
    });
    setAnimations(initialAnimations);
  }, []);

  const toggleExpand = (id) => {
    if (!animations[id]) return;
    
    setExpandedId(expandedId === id ? null : id);
    Animated.timing(animations[id], {
      toValue: expandedId === id ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleBackgroundPress = () => {
    if (expandedId && animations[expandedId]) {
      Animated.timing(animations[expandedId], {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setExpandedId(null));
    }
  };

    const renderItem = ({ item }) => {
    const isExpanded = expandedId === item.id;
    const animation = animations[item.id];
  
    if (!animation) return null;
  
    return (
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          toggleExpand(item.id);
        }}
      >
        <View style={styles.card}>
          <Text style={styles.cardText}>{item.name}</Text>
          <Animated.View
            style={[
              styles.expandedContent,
              {
                opacity: animation,
                maxHeight: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 500],
                }),
                transform: [
                  {
                    translateY: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.description}>{item.description}</Text>
            <MapView
              style={styles.miniMap}
              initialRegion={{
                latitude: item.coordinates.latitude,
                longitude: item.coordinates.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
            >
              <Marker coordinate={item.coordinates} />
            </MapView>
            <TouchableOpacity
              style={styles.viewMapButton}
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate('Map', { routeId: item.id });
              }}
            >
              <Text style={styles.viewMapButtonText}>View in Map</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={handleBackgroundPress}>
      <View style={styles.container}>
        <Text style={styles.text}>Most Used Screen</Text>
        <FlatList
          data={mostUsed}
          keyExtractor={(item) => item.id}
          key={'single-column'}
          numColumns={1}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          style={styles.list}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dce2ef',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  list: {
    width: '100%',
  },
  card: {
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: '98%',
    margin: 10,
    padding: 25,
    backgroundColor: 'white',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  cardText: {
    fontSize: 22,
    fontWeight: '500',
  },
  listContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    width: '100%',
  },
  expandedContent: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  description: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
  },
  miniMap: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginBottom: 15,
  },
  viewMapButton: {
    backgroundColor: '#4a90e2',
    padding: 10,
    borderRadius: 15,
    width: '50%',
    alignItems: 'center',
  },
  viewMapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MostUsedScreen;