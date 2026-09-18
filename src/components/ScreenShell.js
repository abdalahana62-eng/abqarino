import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { colors, space } from '../theme';

// Shared screen frame: soft background + scrollable padded content.
export default function ScreenShell({ children, bg = colors.bg }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.lg, flexGrow: 1 }}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
