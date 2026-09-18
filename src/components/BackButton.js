import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, font, fam, space, radius, clay } from '../theme';
import { tap } from '../utils/speech';

// Chunky clay back button (RTL: arrow points right).
// Uses an explicit `to` route with navigate() — reliable on all platforms.
export default function BackButton({ to, navigation, routeParams, label = 'رجوع', onPress }) {
  const go = () => {
    tap();
    if (onPress) {
      onPress();
      return;
    }
    if (to && navigation) {
      navigation.navigate(to, routeParams);
    } else if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  return (
    <Pressable
      onPress={go}
      hitSlop={12}
      android_ripple={{ color: colors.cardBorder, borderless: false }}
      style={({ pressed }) => [
        styles.btn,
        pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
      ]}
    >
      <Text style={styles.arrow}>→</Text>
      <Text style={styles.txt}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.cardBg,
    borderWidth: clay.border,
    borderColor: colors.cardBorder,
    borderBottomWidth: clay.edge,
    borderBottomColor: colors.clayEdge,
    borderRadius: radius.round,
    paddingHorizontal: space.md,
    minHeight: 52,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  arrow: { fontSize: font.md, fontWeight: '900', color: colors.text },
  txt: { fontSize: font.sm, fontFamily: fam.roundBold, color: colors.text },
});
