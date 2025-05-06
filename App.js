import React from 'react';
import { StatusBar, SafeAreaView } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import Auth from './components/Auth';

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <Auth />
      </SafeAreaView>
      <AppNavigator />
    </>
  );
}