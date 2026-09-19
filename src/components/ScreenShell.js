import React from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { colors, space } from '../theme';

// Shared screen frame. With `header`, the header stays fixed on top
// (status area blends with it) and only the body scrolls.
// Body content is constrained to mobile width (520) and centered,
// so the web/desktop view looks like a phone screen like the reference.
export default function ScreenShell({ children, bg = colors.cardBg, header }) {
  const topBg = header ? colors.purple : bg;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: topBg }}>
      {header}
      <View style={[{ flex: 1, backgroundColor: bg }, !!header && bodyCard]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.lg, flexGrow: 1, alignItems: 'center' }}
        >
          <View style={styles.page}>{children}</View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  page: { width: '100%', maxWidth: 520 },
};

const bodyCard = {
  borderTopLeftRadius: 44,
  borderTopRightRadius: 44,
  marginTop: -28,
  overflow: 'hidden',
};
