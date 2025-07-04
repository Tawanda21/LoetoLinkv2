import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

const ProfileScreen = ({ navigation }) => {
  const Profile = []
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Screen</Text>
      
      <TouchableOpacity style={[styles.button, { backgroundColor: '#001F3F'}]} onPress={() => {}}>
        <Text style={styles.buttonText}>Edit Information</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, { backgroundColor: '#364c84' }]} onPress={() => {}}>
        <Text style={styles.buttonText}>Change Theme</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, { backgroundColor: '#95b1ee' }]} onPress={() => {}}>
        <Text style={styles.buttonText}>Change Language</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, { backgroundColor: '#dce2ef' }]} onPress={() => {}}>
        <Text style={[styles.buttonText, { color: 'black' }]}>Logout</Text>
      </TouchableOpacity>
      
    </View>
  );
}

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
    marginBottom: 30,
  },
  button: {
    padding: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
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
    fontWeight: '500',
  },
});

export default ProfileScreen;