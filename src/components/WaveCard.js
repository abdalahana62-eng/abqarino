import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme';
import { tap } from '../utils/speech';

// Pastel card with the reference "wave" look:
// solid pastel bg + 2 big translucent white circles (top-right / bottom-left)
// + soft shadow. No borders, radius 28 like the Smart Learning design.
export default function WaveCard({ bg = colors.purpleSoft, children, onPress, style }) {
  const Inner = (
    <View style={[styles.card, { backgroundColor: bg }, style]}>
      <View pointerEvents="none" style={styles.wave1} />
      <View pointerEvents="none" style={styles.wave2} />
      <View pointerEvents="none" style={styles.wave3} />
      <View style={styles.content}>{children}</View>
    </View>
  );

  if (!onPress) return Inner;

  return (
    <Pressable
      onPress={() => { tap(); onPress?.(); }}
      android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
      style={({ pressed }) => [pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
    >
      {Inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: space.md,
    marginBottom: space.md,
    overflow: 'hidden',
    minHeight: 130,
    shadowColor: '#5A45D6',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  wave1: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.35)',
    top: -70,
    right: -50,
  },
  wave2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.28)',
    bottom: -55,
    left: -30,
  },
  wave3: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.22)',
    top: 20,
    left: '40%',
  },
  content: { flex: 1 },
});
