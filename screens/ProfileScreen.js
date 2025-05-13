import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, Animated, TouchableWithoutFeedback, TextInput } from 'react-native';
import UserHeader from '../components/UserHeader';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase'; 

const ProfileScreen = ({ navigation }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState('CurrentUsername'); // Replace with actual username from user data
  const dropdownHeight = useRef(new Animated.Value(0)).current;
  const dropdownOpacity = useRef(new Animated.Value(0)).current;

  const toggleDropdown = () => {
    const toValue = showDropdown ? 0 : 200;
    const opacityValue = showDropdown ? 0 : 1;
    setShowDropdown(!showDropdown);

    Animated.parallel([
      Animated.spring(dropdownHeight, {
        toValue,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(dropdownOpacity, {
        toValue: opacityValue,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Logout canceled'),
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => navigation.replace('Login'), // Replace with your login screen name
        },
      ],
      { cancelable: true }
    );
  };

  const handleOptionSelect = (option) => {
    toggleDropdown();
    switch (option) {
      case 'new':
        // Add logic for new profile picture
        break;
      case 'username':
        setIsEditingUsername(true); // Enable editing mode
        break;
      case 'email':
        // Add logic for changing email
        break;
      case 'password':
        // Add logic for changing password
        break;
    }
  };

    const handleSaveUsername = async () => {
    try {
      console.log('Attempting to update username:', username); // Debug log
  
      // Update the display name in the authentication table
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: username }, // Update the display name field
      });
  
      if (error) {
        console.error('Error updating username:', error.message);
        Alert.alert('Error', 'Failed to update username. Please try again.');
        return;
      }
  
      console.log('Username updated successfully:', data);
      Alert.alert('Success', 'Username updated successfully!');
      setIsEditingUsername(false); // Exit editing mode
  
      // Fetch user data to verify the update
      const { data: userData, error: fetchError } = await supabase.auth.getUser();
      if (fetchError) {
        console.error('Error fetching user data:', fetchError.message);
      } else {
        console.log('Updated user data:', userData);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => showDropdown && toggleDropdown()}>
      <View style={styles.container}>
        <View style={styles.profilePictureContainer}>
          <UserHeader minimal />
          <TouchableOpacity style={styles.editIconContainer} onPress={toggleDropdown}>
            <MaterialIcons name="edit" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.contentContainer]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.dropdown,
                {
                  height: dropdownHeight,
                  opacity: dropdownOpacity,
                  display: showDropdown ? 'flex' : 'none',
                },
              ]}
            >
              <TouchableOpacity style={styles.dropdownItem} onPress={() => handleOptionSelect('new')}>
                <Text style={styles.dropdownText}>New Profile Picture</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => handleOptionSelect('username')}>
                <Text style={styles.dropdownText}>Edit Username</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => handleOptionSelect('email')}>
                <Text style={styles.dropdownText}>Change Email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => handleOptionSelect('password')}>
                <Text style={styles.dropdownText}>Change Password</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>

          {isEditingUsername && (
            <View style={styles.editUsernameContainer}>
              <TextInput
                style={styles.editableTextInput}
                value={username}
                onChangeText={setUsername}
                onBlur={handleSaveUsername} // Save when input loses focus
                autoFocus
              />
              <TouchableOpacity onPress={handleSaveUsername} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={[styles.button, { backgroundColor: '#364c84' }]} onPress={() => {}}>
            <Text style={styles.buttonText}>Change Theme</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: '#660F24' }]} onPress={handleLogout}>
            <Text style={[styles.buttonText, { color: 'white' }]}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
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
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  profilePictureContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  editIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(77, 77, 77, 0.17)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 5,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  editUsernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  editableTextInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#364c84',
    padding: 10,
    borderRadius: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
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