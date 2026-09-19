import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, font, fam, space } from '../theme';
import Mascot from './Mascot';
import BackButton from './BackButton';

// Brand purple header with big rounded bottom (mirrors the reference design).
// White bold title + mascot bubble; optional back pill and right-side slot.
// Pass mascotImage (require) to show the generated owl instead of emoji.
export default function AppHeader({
  title = 'عبقرينو الصغير',
  subtitle,
  mascot = '🧠',
  mascotImage,
  mascotColors,
  showBack,
  backTo,
  backParams,
  navigation,
  right,
}) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        {showBack ? (
          <BackButton to={backTo} routeParams={backParams} navigation={navigation} />
        ) : (
          <View style={{ width: 52 }} />
        )}
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.sub}>{subtitle}</Text>}
        </View>
        {mascotImage ? (
          <Image source={mascotImage} style={styles.mascotImg} />
        ) : (
          <Mascot emoji={mascot} size={44} colors={mascotColors || ['#FFFFFF', '#EDE9FE']} />
        )}
      </View>
      {!!right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.purple,
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xl,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: space.sm,
  },
  titleWrap: { flex: 1, alignItems: 'flex-end' },
  title: {
    fontSize: font.lg,
    fontFamily: fam.round,
    color: colors.textLight,
    textAlign: 'right',
    textShadowColor: 'rgba(15,23,42,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sub: {
    fontSize: font.xs,
    fontFamily: fam.roundBold,
    color: colors.textLight,
    opacity: 0.92,
    textAlign: 'right',
    marginTop: 2,
  },
  right: { marginTop: space.sm, alignItems: 'center' },
  mascotImg: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: '#fff',
  },
});
