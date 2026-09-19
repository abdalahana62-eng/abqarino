import React from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  BalooBhaijaan2_500Medium,
  BalooBhaijaan2_700Bold,
} from '@expo-google-fonts/baloo-bhaijaan-2';
import { Cairo_900Black } from '@expo-google-fonts/cairo';
import RootNavigator from './src/navigation/RootNavigator';
import './src/utils/webFix';

export default function App() {
  // Rounded Arabic font for headings; screens render right away and
  // swap to it once loaded (no blocking splash).
  useFonts({
    BalooBhaijaan2_500Medium,
    BalooBhaijaan2_700Bold,
    Cairo_900Black,
  });

  return (
    <>
      <StatusBar style="dark" />
      <RootNavigator />
    </>
  );
}
