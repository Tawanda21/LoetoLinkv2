import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </>
  );
}