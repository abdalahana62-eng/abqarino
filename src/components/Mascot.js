import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Glossy 3D-style bubble for mascots and icons:
// soft gradient sphere + white highlight + deep shadow makes any
// emoji look like a 3D toy on every platform (even where the OS
// draws monochrome glyphs).
export default function Mascot({ emoji, size = 96, colors: pair, style }) {
  const s = size + 44;
  const [from, to] = pair || ['#FFFFFF', '#E4ECFC'];
  return (
    <LinearGradient
      colors={[from, to]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.bubble, { width: s, height: s, borderRadius: s / 2 }, style]}
    >
      <View style={[styles.shine, { width: s * 0.42, height: s * 0.24, borderRadius: s * 0.21, top: s * 0.1, left: s * 0.14 }]} />
      <Text style={{ fontSize: size }}>{emoji}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 7,
    borderBottomColor: 'rgba(15,23,42,0.14)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  shine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.55)',
    transform: [{ rotate: '-18deg' }],
  },
});
