import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import UserHeader from '../components/UserHeader';
import { supabase } from '../lib/supabase';
import CustomPopup from '../components/CustomPopup';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState({ visible: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
      setLoading(false);
    };
    fetchUser();
  }, []);

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

  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator size="large" color="#001F3F" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.card, { marginTop: -50 }]}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        </View>
        <CustomPopup
          visible={popup.visible}
          title={popup.title}
          message={popup.message}
          onClose={() => setPopup({ ...popup, visible: false })}
          onConfirm={popup.onConfirm}
          conformText={popup.title === 'Logout' ? 'Logout' : 'OK'}
          cancelText={popup.title === 'Logout' ? 'Cancel' : 'Cancel'}
          />
        <Text style={styles.name}>
          {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'User'}
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#001F3F' }]} onPress={() => {}}>
            <Text style={styles.buttonText}>Edit Info</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#364c84' }]} onPress={() => {}}>
            <Text style={styles.buttonText}>Theme</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.buyButton]} onPress={handleLogout}>
          <Text style={styles.buyButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f7fa',
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
  subtitle: {
    fontSize: 15,
    color: '#888',
    marginTop: 2,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
  }
});

export default ProfileScreen;