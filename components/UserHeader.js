import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const fallbackAvatar = require('../assets/avatar.jpg');

const UserHeader = ({ onAvatarPress }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const { user } = data;
        const displayName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email;
        const avatar =
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null;
        setUser({
          name: displayName,
          avatar,
        });
      }
    };
    fetchUser();
  }, []);

  // Fix the avatar URL logic
  const getAvatarSource = () => {
    if (user?.avatar) {
      return { uri: user.avatar };
    }
    return fallbackAvatar;
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onAvatarPress}>
        <Image source={getAvatarSource()} style={styles.avatar} />
      </TouchableOpacity>
      <Text style={styles.greeting}>
        Hey, <Text style={styles.name}>{user?.name || 'User'}</Text>
      </Text>
      <TouchableOpacity>
        <Ionicons name="notifications-outline" size={28} color="#333" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 10,
    marginTop: 40,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'space-between',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 16,
  },
  greeting: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  name: {
    fontWeight: 'bold',
  },
});

export default UserHeader;