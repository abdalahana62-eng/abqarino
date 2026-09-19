import React from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  BalooBhaijaan2_500Medium,
  BalooBhaijaan2_700Bold,
  BalooBhaijaan2_800ExtraBold,
} from '@expo-google-fonts/baloo-bhaijaan-2';
import { Cairo_900Black, Cairo_700Bold } from '@expo-google-fonts/cairo';
import RootNavigator from './src/navigation/RootNavigator';
import './src/utils/webFix';

export default function App() {
  // Bold rounded Arabic fonts; screens render right away and
  // swap to them once loaded (no blocking splash).
  useFonts({
    BalooBhaijaan2_500Medium,
    BalooBhaijaan2_700Bold,
    BalooBhaijaan2_800ExtraBold,
    Cairo_900Black,
    Cairo_700Bold,
  });

  return (
    <>
      <StatusBar style="dark" />
      <RootNavigator />
    </>
  );
}
