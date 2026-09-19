import React from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { colors, space } from '../theme';

// Shared screen frame. With `header`, the header stays fixed on top
// (status area blends with it) and only the white body scrolls.
export default function ScreenShell({ children, bg = colors.cardBg, header }) {
  const topBg = header ? colors.purple : bg;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: topBg }}>
      {header}
      <View style={[{ flex: 1, backgroundColor: bg }, !!header && bodyCard]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.lg, flexGrow: 1 }}
        >
          {children}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const bodyCard = {
  borderTopLeftRadius: 44,
  borderTopRightRadius: 44,
  marginTop: -28,
  overflow: 'hidden',
};
