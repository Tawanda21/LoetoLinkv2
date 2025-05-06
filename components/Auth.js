import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { supabase } from '../lib/supabase'; // Adjust the import path as necessary
import { Button, Input } from '@rneui/themed';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signInWithEmail = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert(error.message);
  };

  const signUpWithEmail = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert(error.message);
  };

  return (
    <View style={styles.container}>
      <Input
        label="Email"
        leftIcon={{ type: 'font-awesome', name: 'envelope' }}
        onChangeText={setEmail}
        value={email}
        placeholder="email@address.com"
        autoCapitalize="none"
      />
      <Input
        label="Password"
        leftIcon={{ type: 'font-awesome', name: 'lock' }}
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        placeholder="Password"
        autoCapitalize="none"
      />
      <Button title="Sign In" onPress={signInWithEmail} />
      <Button title="Sign Up" onPress={signUpWithEmail} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
});