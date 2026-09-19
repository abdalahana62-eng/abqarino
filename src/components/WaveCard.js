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
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.5)',
    top: -80,
    right: -60,
  },
  wave2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.38)',
    bottom: -60,
    left: -35,
  },
  wave3: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.3)',
    top: 24,
    left: '42%',
  },
  content: { flex: 1 },
});
