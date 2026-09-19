import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { colors, font, fam, space, radius } from '../theme';
import { storage } from '../utils/storage';
import { IMAGES } from '../utils/images';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    let mounted = true;
    (async () => {
      await new Promise((r) => setTimeout(r, 1600));
      const profile = await storage.getProfile();
      if (!mounted) return;
      if (profile) navigation.replace('Home', { profile });
      else navigation.replace('ParentGate');
    })();
    return () => { mounted = false; };
  }, [navigation]);

  return (
    <View style={styles.c}>
      <View style={styles.card}>
        <View style={styles.wave1} />
        <View style={styles.wave2} />
        <Text style={styles.kicker}>Welcome to Smart</Text>
        <Text style={styles.title}>Learning</Text>
        <Text style={styles.sub}>عبقرينو الصغير • هنتعلّم ونلعب</Text>
        <Image source={IMAGES.heroBoy} style={styles.img} contentFit="cover" />
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
      </View>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: space.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.purpleSoft,
    borderRadius: 36,
    padding: space.lg,
    overflow: 'hidden',
    alignItems: 'center',
    shadowColor: '#5A45D6',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  wave1: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.35)', top: -90, right: -70,
  },
  wave2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.25)', bottom: -60, left: -40,
  },
  kicker: { fontSize: font.md, fontFamily: fam.roundBold, color: colors.text, marginTop: space.sm },
  title: {
    fontSize: 52, fontFamily: fam.round, color: colors.text,
    backgroundColor: colors.yellowSoft, paddingHorizontal: 18,
    borderRadius: 16, overflow: 'hidden', marginTop: 4,
    transform: [{ rotate: '-2deg' }],
  },
  sub: { fontSize: font.xs, fontFamily: fam.roundMedium, color: colors.text, opacity: 0.7, marginTop: space.sm },
  img: { width: '100%', height: 320, borderRadius: 28, marginTop: space.md, backgroundColor: '#fff' },
  dots: { flexDirection: 'row', gap: 8, marginTop: space.md },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(34,28,70,0.2)' },
  dotActive: { width: 28, backgroundColor: colors.text },
});
