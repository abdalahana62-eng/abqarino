import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, font, weight, space } from '../theme';
import { storage } from '../utils/storage';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    let mounted = true;
    (async () => {
      await new Promise((r) => setTimeout(r, 1000));
      const profile = await storage.getProfile();
      if (!mounted) return;
      if (profile) navigation.replace('Home', { profile });
      else navigation.replace('ParentGate');
    })();
    return () => { mounted = false; };
  }, [navigation]);

  return (
    <View style={styles.c}>
      <Text style={styles.e}>🧠✨</Text>
      <Text style={styles.t}>عبقرينو الصغير</Text>
      <Text style={styles.s}>هنتعلّم ونلعب مع بعض!</Text>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: space.xl }} />
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  e: { fontSize: 110, marginBottom: space.md },
  t: { fontSize: font.xxl, fontWeight: weight.black, color: colors.text, textAlign: 'center' },
  s: { fontSize: font.md, color: colors.text, marginTop: space.sm, opacity: 0.7 },
});
