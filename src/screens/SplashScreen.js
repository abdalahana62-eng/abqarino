import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, font, fam, space } from '../theme';
import { storage } from '../utils/storage';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    let mounted = true;
    (async () => {
      await new Promise((r) => setTimeout(r, 1200));
      const profile = await storage.getProfile();
      if (!mounted) return;
      if (profile) navigation.replace('Home', { profile });
      else navigation.replace('ParentGate');
    })();
    return () => { mounted = false; };
  }, [navigation]);

  return (
    <LinearGradient
      colors={[colors.primary, colors.blue, colors.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.c}
    >
      <View style={styles.bubble}>
        <Text style={styles.e}>🧠✨</Text>
      </View>
      <Text style={styles.t}>عبقرينو الصغير</Text>
      <Text style={styles.s}>هنتعلّم ونلعب مع بعض!</Text>
      <ActivityIndicator size="large" color={colors.textLight} style={{ marginTop: space.xl }} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 190,
    height: 190,
    borderRadius: 95,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.6)',
    marginBottom: space.md,
  },
  e: { fontSize: 100 },
  t: {
    fontSize: font.xxl,
    fontFamily: fam.round,
    color: colors.textLight,
    textAlign: 'center',
    textShadowColor: 'rgba(15,23,42,0.25)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  s: {
    fontSize: font.md,
    fontFamily: fam.roundMedium,
    color: colors.textLight,
    marginTop: space.sm,
    opacity: 0.95,
  },
});
