import React from 'react';
import { StatusBar, SafeAreaView } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { FavoriteProvider } from './contexts/FavoriteContext';

export default function App() {
  return (
    <FavoriteProvider>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </FavoriteProvider>
  );
}