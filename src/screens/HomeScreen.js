import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font, fam, space, radius } from '../theme';
import { getAgeGroup } from '../data/ageGroups';
import { storage } from '../utils/storage';
import { tap } from '../utils/speech';
import AppHeader from '../components/AppHeader';
import TopicCard from '../components/TopicCard';
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
    <ScreenShell
      header={
        <AppHeader
          mascot={group.emoji}
          subtitle={`${profile?.name} • ${group.label}`}
          right={
            <View style={styles.starsPill}>
              <Text style={styles.starsTxt}>⭐ {stars} نجمة</Text>
            </View>
          }
        />
      }
    >
      <Text style={styles.section}>هنعمل إيه النهارده؟</Text>
      <Text style={styles.sub}>اختار لعبة ويلا نبدأ 🎮</Text>

      <TopicCard
        emoji="🔟"
        label="عدّ، جمع، طرح، ضرب، قسمة"
        title="الحساب"
        color={colors.primary}
        onPress={() => navigation.navigate('MathMenu', { profile })}
      />

      <TopicCard
        emoji="📚"
        label="عربي وإنجليزي"
        title="الكلمات"
        color={colors.secondary}
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
  starsPill: {
    backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: space.md,
    paddingVertical: 6, borderRadius: radius.round,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  starsTxt: { color: colors.textLight, fontFamily: fam.round, fontSize: font.sm },
  section: {
    fontSize: font.lg, fontFamily: fam.round, color: colors.text,
    textAlign: 'right', marginTop: space.sm,
  },
  sub: {
    fontSize: font.xs, fontFamily: fam.roundMedium, color: colors.muted,
    textAlign: 'right', marginTop: 2, marginBottom: space.md,
  },
  resetBtn: { marginTop: space.xl, padding: space.md, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  resetTxt: { color: colors.muted, fontSize: font.xs, fontFamily: fam.roundBold },
});
