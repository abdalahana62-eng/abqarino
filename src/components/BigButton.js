import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors, font, weight, space, radius } from '../theme';
import { tap } from '../utils/speech';

export default function BigButton({
  title, emoji, subtitle, color = colors.primary,
  onPress, style, textStyle, disabled,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={() => { tap(); onPress?.(); }}
      style={[styles.btn, { backgroundColor: color }, style]}
    >
      <View style={styles.row}>
        {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, textStyle]}>{title}</Text>
          {subtitle ? <Text style={[styles.sub, textStyle]}>{subtitle}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.md,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: space.md,
  },
  emoji: { fontSize: 44 },
  title: {
    fontSize: font.md,
    fontWeight: weight.black,
    color: colors.textLight,
    textAlign: 'right',
  },
  sub: {
    fontSize: font.xs,
    color: colors.textLight,
    opacity: 0.9,
    textAlign: 'right',
    marginTop: 2,
  },
});
