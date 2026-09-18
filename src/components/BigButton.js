import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, font, fam, space, radius, clay } from '../theme';
import { tap } from '../utils/speech';

// Chunky clay menu button: solid color, thick toy-like bottom edge,
// soft shadow, press feedback (opacity + scale + Android ripple).
export default function BigButton({
  title, emoji, subtitle, color = colors.primary,
  ink = colors.textLight, onPress, style, textStyle, disabled,
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => { tap(); onPress?.(); }}
      android_ripple={{ color: 'rgba(255,255,255,0.25)', borderless: false }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: color },
        pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      <View style={styles.row}>
        {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: ink }, textStyle]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.sub, { color: ink }, textStyle]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.lg,
    borderBottomWidth: clay.edge,
    borderBottomColor: colors.clayEdge,
    padding: space.md,
    marginBottom: space.md,
    minHeight: 96,
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: space.md,
  },
  emoji: { fontSize: 48 },
  title: {
    fontSize: font.md,
    fontFamily: fam.round,
    textAlign: 'right',
  },
  sub: {
    fontSize: font.xs,
    fontFamily: fam.roundMedium,
    opacity: 0.92,
    textAlign: 'right',
    marginTop: 2,
  },
});
