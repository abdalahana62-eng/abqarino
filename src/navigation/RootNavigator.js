import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from '../screens/SplashScreen';
import ParentGateScreen from '../screens/ParentGateScreen';
import HomeScreen from '../screens/HomeScreen';
import MathMenuScreen from '../screens/MathMenuScreen';
import MathPlayScreen from '../screens/MathPlayScreen';
import VocabMenuScreen from '../screens/VocabMenuScreen';
import VocabPlayScreen from '../screens/VocabPlayScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#FFF8E7' },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="ParentGate" component={ParentGateScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MathMenu" component={MathMenuScreen} />
        <Stack.Screen name="MathPlay" component={MathPlayScreen} />
        <Stack.Screen name="VocabMenu" component={VocabMenuScreen} />
        <Stack.Screen name="VocabPlay" component={VocabPlayScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
