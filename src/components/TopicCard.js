import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, font, fam, space, radius, clay } from '../theme';
import { tap } from '../utils/speech';
import Mascot from './Mascot';

// Pastel card like the reference: soft tinted background, illustration
// bubble, small gray label + bold title, yellow circular arrow (RTL: left).
// `selected` turns it into a solid picked state with a check badge.
export default function TopicCard({
  emoji,
  label,
  title,
  color = colors.primary,
  soft,
  onPress,
  selected,
}) {
  const bg = selected ? color : soft || `${color}1A`;
  const ink = selected ? colors.textLight : colors.text;
  return (
    <Pressable
      onPress={() => { tap(); onPress?.(); }}
      android_ripple={{ color: colors.clayEdge }}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: bg, borderColor: selected ? color : `${color}55` },
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      ]}
    >
      <Mascot emoji={emoji} size={44} colors={['#FFFFFF', soft || '#EDE9FE']} />
      <View style={{ flex: 1 }}>
        {!!label && (
          <Text style={[styles.label, { color: selected ? colors.textLight : colors.muted }]}>
            {label}
          </Text>
        )}
        <Text style={[styles.title, { color: ink }]}>{title}</Text>
      </View>
      {selected ? (
        <View style={styles.check}>
          <Text style={styles.checkTxt}>✓</Text>
        </View>
      ) : (
        <View style={styles.arrow}>
          <Text style={styles.arrowTxt}>←</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.lg,
    borderWidth: clay.border,
    borderBottomWidth: clay.edge,
    borderBottomColor: colors.clayEdge,
    padding: space.md,
    marginBottom: space.md,
    minHeight: 104,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  label: {
    fontSize: font.xs,
    fontFamily: fam.roundMedium,
    textAlign: 'right',
  },
  title: {
    fontSize: font.md,
    fontFamily: fam.round,
    textAlign: 'right',
    marginTop: 2,
  },
  arrow: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFC531',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(15,23,42,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowTxt: { fontSize: 24, fontWeight: '900', color: colors.text },
  check: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkTxt: { fontSize: 26, fontWeight: '900', color: colors.textLight },
});
