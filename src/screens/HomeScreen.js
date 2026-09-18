import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { colors, font, weight, space, radius } from '../theme';
import { getAgeGroup } from '../data/ageGroups';
import { storage } from '../utils/storage';
import BigButton from '../components/BigButton';

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
    await storage.clearProfile();
    navigation.replace('ParentGate');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.c}>
        <View style={[styles.hero, { backgroundColor: group.color }]}>
          <Text style={styles.heroEmoji}>{group.emoji}</Text>
          <Text style={styles.heroName}>أهلًا {profile?.name}! 👋</Text>
          <Text style={styles.heroAge}>{group.label}</Text>
          <View style={styles.starsPill}>
            <Text style={styles.starsTxt}>⭐ {stars} نجمة</Text>
          </View>
        </View>

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
          onPress={() => navigation.navigate('VocabMenu', { profile })}
        />

        <TouchableOpacity onPress={reset} style={styles.resetBtn}>
          <Text style={styles.resetTxt}>⚙️ إعدادات الأهل (تغيير السن)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { padding: space.lg, flexGrow: 1 },
  hero: { borderRadius: radius.xl, padding: space.lg, alignItems: 'center', marginBottom: space.lg },
  heroEmoji: { fontSize: 84 },
  heroName: {
    fontSize: font.lg, fontWeight: weight.black, color: colors.textLight,
    marginTop: space.sm, textAlign: 'center',
  },
  heroAge: { fontSize: font.sm, color: colors.textLight, opacity: 0.95, marginTop: 4 },
  starsPill: {
    backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: space.md,
    paddingVertical: 6, borderRadius: radius.round, marginTop: space.sm,
  },
  starsTxt: { color: colors.textLight, fontWeight: weight.black, fontSize: font.sm },
  section: {
    fontSize: font.md, fontWeight: weight.black, color: colors.text,
    textAlign: 'right', marginBottom: space.md,
  },
  resetBtn: { marginTop: space.xl, padding: space.md, alignItems: 'center' },
  resetTxt: { color: colors.muted, fontSize: font.xs, fontWeight: weight.bold },
});
