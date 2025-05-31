import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Animated, TouchableWithoutFeedback, TextInput, ImageBackground } from 'react-native';
import UserHeader from '../components/UserHeader';
import { supabase } from '../lib/supabase';
import CustomPopup from '../components/CustomPopup';
import { Feather } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState({ visible: false, title: '', message: '', onConfirm: null });
  const [showEditMenu, setShowEditMenu] = useState(false);
  const menuAnimation = new Animated.Value(0);

  // Popup states for custom popups
  const [activePopup, setActivePopup] = useState(null); // 'username' | 'email' | 'password' | null
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
      setLoading(false);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    Animated.spring(menuAnimation, {
      toValue: showEditMenu ? 1 : 0,
      tension: 20,
      friction: 7,
      useNativeDriver: false,
    }).start();
  }, [showEditMenu]);

  const handleLogout = () => {
    setPopup({
      visible: true,
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      onConfirm: async () => {
        setPopup({ ...popup, visible: false });
        await supabase.auth.signOut();
        navigation.replace('Login');
      },
    });
  };

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff';

  const menuHeight = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150],
  });

  const menuOpacity = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (loading) {
    return (
      <ImageBackground
        source={require('../assets/background.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={styles.screen}>
          <ActivityIndicator size="large" color="#001F3F" />
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/background.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <TouchableWithoutFeedback onPress={() => {
        setShowEditMenu(false);
        setActivePopup(null);
        setPopup({ ...popup, visible: false });
      }}>
        <View style={styles.screen}>
          <View style={[styles.card, { marginTop: -50 }]}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            </View>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View>
                <CustomPopup
                  visible={popup.visible}
                  title={popup.title}
                  message={popup.message}
                  onClose={() => setPopup({ ...popup, visible: false })}
                  onConfirm={popup.onConfirm}
                  confirmText={popup.title === 'Logout' ? 'Logout' : 'OK'}
                />
                {/* Username Popup */}
                {activePopup === 'username' && (
                  <CustomPopup
                    visible={true}
                    title="Change Username"
                    onClose={() => setActivePopup(null)}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new username"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={() => {
                        // TODO: handle username change
                        setActivePopup(null);
                      }}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </CustomPopup>
                )}
                {/* Email Popup */}
                {activePopup === 'email' && (
                  <CustomPopup
                    visible={true}
                    title="Change Email"
                    onClose={() => setActivePopup(null)}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new email"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={() => {
                        // TODO: handle email change
                        setActivePopup(null);
                      }}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </CustomPopup>
                )}
                {/* Password Popup */}
                {activePopup === 'password' && (
                  <CustomPopup
                    visible={true}
                    title="Change Password"
                    onClose={() => setActivePopup(null)}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Current password"
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <View style={{ width: '100%', position: 'relative' }}>
                      <TextInput
                        style={styles.input}
                        placeholder="New password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#888" />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={() => {
                        // TODO: handle password change
                        setActivePopup(null);
                      }}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </CustomPopup>
                )}
              </View>
            </TouchableWithoutFeedback>
            <Text style={styles.name}>
              {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'User'}
            </Text>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={(e) => {
                e.stopPropagation();
                setShowEditMenu(!showEditMenu);
              }}
            >
              <Feather name="edit-2" size={24} color="#001F3F" />
            </TouchableOpacity>
            
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <Animated.View style={[styles.editMenu, { maxHeight: menuHeight, opacity: menuOpacity }]}>
                <TouchableOpacity style={styles.menuItem} onPress={() => setActivePopup('username')}>
                  <Text style={styles.menuText}>Change Username</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => setActivePopup('email')}>
                  <Text style={styles.menuText}>Change Email</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => setActivePopup('password')}>
                  <Text style={styles.menuText}>Change Password</Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
            
            <TouchableOpacity style={[styles.buyButton]} onPress={handleLogout}>
              <Text style={styles.buyButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 340,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#e0e0e0',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#222',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 24,
    color: '#222',
  },
  editButton: {
    alignItems: 'center',
    marginBottom: 14,
  },
  editMenu: {
    width: '100%',
    marginBottom: 14,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    fontSize: 16,
    color: '#001F3F',
  },
  buyButton: {
    backgroundColor: '#222',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#418EDA',
    borderRadius: 100,
    paddingVertical: 10,
    paddingHorizontal: 36,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#418EDA',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;