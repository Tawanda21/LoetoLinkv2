import React from 'react';
import { StatusBar, SafeAreaView } from 'react-native';
import AppNavigator from './navigation/AppNavigator';


export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
      </SafeAreaView>
      <AppNavigator />
    </>
  );
}