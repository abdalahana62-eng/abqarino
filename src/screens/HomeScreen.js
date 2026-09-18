import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, font, fam, space, radius, clay } from '../theme';
import { getAgeGroup } from '../data/ageGroups';
import { storage } from '../utils/storage';
import { tap } from '../utils/speech';
import BigButton from '../components/BigButton';
import Mascot from '../components/Mascot';
import ScreenShell from '../components/ScreenShell';

export default function HomeScreen({ route, navigation }) {
  const profile = route.params?.profile;
  const group = getAgeGroup(profile?.ageGroupId);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    (async () => {
      const p = await storage.getProgress();
      setStars(p.stars);
    })();
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', async () => {
      const p = await storage.getProgress();
      setStars(p.stars);
    });
    return unsub;
  }, [navigation]);

  const reset = async () => {
    tap();
    await storage.clearProfile();
    navigation.replace('ParentGate');
  };

  return (
    <ScreenShell>
      <LinearGradient
        colors={[group.color, group.soft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Mascot emoji={group.emoji} size={84} colors={[group.soft, '#FFFFFF']} style={{ borderColor: group.color }} />
        <Text style={styles.heroName}>أهلًا {profile?.name}! 👋</Text>
        <Text style={styles.heroAge}>{group.label}</Text>
        <View style={styles.starsPill}>
          <Text style={styles.starsTxt}>⭐ {stars} نجمة</Text>
        </View>
      </LinearGradient>

      <Text style={styles.section}>هنعمل إيه النهارده؟</Text>

      <BigButton
        emoji="🔢"
        title="الحساب"
        subtitle="عدّ، جمع، طرح، ضرب، قسمة"
        color={colors.primary}
        onPress={() => navigation.navigate('MathMenu', { profile })}
      />

      <BigButton
        emoji="📚"
        title="الكلمات"
        subtitle="عربي وإنجليزي"
        color={colors.secondary}
        ink={colors.text}
        onPress={() => navigation.navigate('VocabMenu', { profile })}
      />

      <Pressable
        onPress={reset}
        hitSlop={10}
        android_ripple={{ color: colors.cardBorder }}
        style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.6 }]}
      >
        <Text style={styles.resetTxt}>⚙️ إعدادات الأهل (تغيير السن)</Text>
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.xl,
    borderWidth: clay.border,
    borderColor: 'rgba(255,255,255,0.7)',
    borderBottomWidth: clay.edge,
    borderBottomColor: colors.clayEdge,
    padding: space.lg,
    alignItems: 'center',
    marginBottom: space.lg,
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  heroEmoji: { fontSize: 84 },
  heroName: {
    fontSize: font.lg, fontFamily: fam.round, color: colors.textLight,
    marginTop: space.sm, textAlign: 'center',
    textShadowColor: 'rgba(15,23,42,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroAge: {
    fontSize: font.sm, fontFamily: fam.roundBold, color: colors.textLight,
    opacity: 0.95, marginTop: 4,
  },
  starsPill: {
    backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: space.md,
    paddingVertical: 6, borderRadius: radius.round, marginTop: space.sm,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  starsTxt: { color: colors.textLight, fontFamily: fam.round, fontSize: font.sm },
  section: {
    fontSize: font.md, fontFamily: fam.round, color: colors.text,
    textAlign: 'right', marginBottom: space.md,
  },
  resetBtn: { marginTop: space.xl, padding: space.md, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  resetTxt: { color: colors.muted, fontSize: font.xs, fontFamily: fam.roundBold },
});
