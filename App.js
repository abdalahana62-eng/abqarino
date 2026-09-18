import React from 'react';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import './src/utils/webFix';

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <RootNavigator />
    </>
  );
}
