import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Dimensions } from 'react-native';

const TransportInfoScreen = ({ navigation }) => {
  const [expandedCard, setExpandedCard] = React.useState(null);
  const animationValues = React.useRef({});
  const timeoutRef = React.useRef(null);

  const transports = [
    { id: '1', name: 'Combi 1', status: 'On time' },
    { id: '2', name: 'Combi 2', status: 'Delayed' },
    { id: '3', name: 'Combi 3', status: 'Very late' },
  ];

  React.useEffect(() => {
    transports.forEach((transport) => {
      animationValues.current[transport.id] = new Animated.Value(100);
    });
  }, [transports]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'On time':
        return '#95b1ee';
      case 'Delayed':
        return '#364c84';
      case 'Very late':
        return '#001F3F';
      default:
        return 'gray';
    }
  };

  const toggleExpand = (id) => {
    const isExpanded = expandedCard === id;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If a different card is expanded, collapse it first
    if (expandedCard && expandedCard !== id) {
      Animated.timing(animationValues.current[expandedCard], {
        toValue: 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }

    setExpandedCard(isExpanded ? null : id);

    Animated.timing(animationValues.current[id], {
      toValue: isExpanded ? 100 : 300,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (!isExpanded) {
      timeoutRef.current = setTimeout(() => {
        Animated.timing(animationValues.current[id], {
          toValue: 100,
          duration: 300,
          useNativeDriver: false,
        }).start(() => setExpandedCard(null));
      }, 10000);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Your Route Information</Text>
      <FlatList
        data={transports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Animated.View
            style={[
              styles.transportItem,
              { height: animationValues.current[item.id], backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <TouchableOpacity onPress={() => toggleExpand(item.id)} style={styles.cardHeader}>
              <Text style={styles.transportText}>{item.name}</Text>
              <Text style={styles.transportText}>{item.status}</Text>
            </TouchableOpacity>
            {expandedCard === item.id && (
              <View style={styles.miniMap}>
                <Text style={styles.miniMapText}>Mini Map Placeholder</Text>
              </View>
            )}
          </Animated.View>
        )}
        style={styles.flatList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dce2ef',
    padding: 10,
    width: '100%',
    alignSelf: 'center',
  },
  text: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  flatList: {
    width: '100%',
  },
  transportItem: {
    marginVertical: 5,
    borderRadius: 15,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  transportText: {
    color: 'white',
    fontSize: 16,
  },
  miniMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    height: 200,
  },
  miniMapText: {
    color: '#555',
    fontSize: 14,
  },
});

export default TransportInfoScreen;