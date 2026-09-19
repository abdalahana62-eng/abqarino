import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { colors, font, fam, space } from '../theme';
import { getAgeGroup } from '../data/ageGroups';
import { storage } from '../utils/storage';
import { tap } from '../utils/speech';
import ScreenShell from '../components/ScreenShell';
import WaveCard from '../components/WaveCard';
import { IMAGES } from '../utils/images';

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

  const goMath = () => navigation.navigate('MathMenu', { profile });
  const goVocab = () => navigation.navigate('VocabMenu', { profile });

  return (
    <ScreenShell bg={colors.bg}>
      {/* Top greeting like reference */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <Image source={IMAGES.heroBoy} style={styles.avatar} contentFit="cover" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.hey}>أهلاً، {profile?.name || 'صديقي'} 👋</Text>
          <Text style={styles.subHey}>{group.label} • ⭐ {stars} نجمة</Text>
        </View>
        <Pressable onPress={() => tap()} style={styles.bell}>
          <Text style={{ fontSize: 22 }}>🔔</Text>
        </Pressable>
      </View>

      {/* Mastery banner */}
      <WaveCard bg={colors.purpleSoft} onPress={goMath}>
        <Text style={styles.bannerKicker}>تحدي التفوق 🏆</Text>
        <Text style={styles.bannerTitle}>Olympiad{'\n'}Mastery Hub</Text>
        <Text style={styles.bannerSub}>مسائل وألعاب على قد سنك</Text>
        <View style={styles.bannerRow}>
          <Pressable onPress={goMath} style={styles.startBtn}>
            <Text style={styles.startTxt}>ابدأ ▶</Text>
          </Pressable>
          <Image source={IMAGES.heroGirl} style={styles.bannerImg} contentFit="cover" />
        </View>
      </WaveCard>

      {/* Activity header */}
      <View style={styles.sectionRow}>
        <Text style={styles.section}>نشاطك 🎮</Text>
        <Text style={styles.seeAll}>اختار لعبة ويلا نبدأ</Text>
      </View>

      {/* Two activity cards */}
      <View style={styles.grid}>
        <View style={{ flex: 1 }}>
          <WaveCard bg={colors.yellowSoft} onPress={goMath} style={{ minHeight: 210 }}>
            <Text style={styles.cardLabel}>📖 وحدات التعلم</Text>
            <Text style={styles.cardNum}>12</Text>
            <Text style={styles.cardSub}>درس • {group.mathTopics.length} مواضيع</Text>
            <Image source={IMAGES.math} style={styles.cardImg} contentFit="cover" />
            <View style={styles.arrowBtn}>
              <Text style={styles.arrowTxt}>←</Text>
            </View>
          </WaveCard>
        </View>
        <View style={{ flex: 1 }}>
          <WaveCard bg={colors.pinkSoft} onPress={goVocab} style={{ minHeight: 210 }}>
            <Text style={styles.cardLabel}>⏰ ساعات اللعب</Text>
            <Text style={styles.cardNum}>{stars}</Text>
            <Text style={styles.cardSub}>نجمة • {group.vocabTopics.length} مواضيع</Text>
            <Image source={IMAGES.vocab} style={styles.cardImg} contentFit="cover" />
            <View style={styles.arrowBtn}>
              <Text style={styles.arrowTxt}>←</Text>
            </View>
          </WaveCard>
        </View>
      </View>

      {/* Win banner */}
      <WaveCard bg={colors.blueSoft} style={{ minHeight: 0 }}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
          <Image source={IMAGES.win} style={{ width: 84, height: 84, borderRadius: 20 }} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.winTitle}>شغل عظيم!</Text>
            <Text style={styles.winSub}>اجمع نجوم أكتر واكسب الكاس 🏆</Text>
          </View>
        </View>
      </WaveCard>

      {/* Floating bottom bar like reference */}
      <View style={styles.tabBar}>
        <Pressable onPress={() => tap()} style={[styles.tab, styles.tabActive]}>
          <Text style={styles.tabTxt}>🏠</Text>
        </Pressable>
        <Pressable onPress={goMath} style={styles.tab}>
          <Text style={styles.tabTxt}>🔢</Text>
        </Pressable>
        <Pressable onPress={goVocab} style={styles.tab}>
          <Text style={styles.tabTxt}>📚</Text>
        </Pressable>
        <Pressable onPress={reset} style={styles.tab}>
          <Text style={styles.tabTxt}>⚙️</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: space.md },
  avatarWrap: {
    width: 56, height: 56, borderRadius: 28, overflow: 'hidden',
    borderWidth: 3, borderColor: '#fff', backgroundColor: '#fff', elevation: 3,
  },
  avatar: { width: '100%', height: '100%' },
  hey: { fontSize: font.md, fontFamily: fam.round, color: colors.text, textAlign: 'right' },
  subHey: { fontSize: font.xs, fontFamily: fam.roundMedium, color: colors.muted, textAlign: 'right' },
  bell: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', elevation: 2,
  },
  bannerKicker: { fontSize: font.xs, fontFamily: fam.roundBold, color: colors.text },
  bannerTitle: { fontSize: 34, fontFamily: fam.round, color: colors.text, lineHeight: 40, marginTop: 2 },
  bannerSub: { fontSize: font.xs, fontFamily: fam.roundMedium, color: colors.text, opacity: 0.7, marginTop: 4 },
  bannerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 },
  startBtn: {
    backgroundColor: '#221C46', paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: 999, minHeight: 48, justifyContent: 'center',
  },
  startTxt: { color: '#fff', fontFamily: fam.round, fontSize: font.sm },
  bannerImg: { width: 150, height: 130, borderRadius: 22, backgroundColor: '#fff' },
  sectionRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4, marginBottom: 10 },
  section: { fontSize: font.md, fontFamily: fam.round, color: colors.text },
  seeAll: { fontSize: font.xs, fontFamily: fam.roundMedium, color: colors.muted },
  grid: { flexDirection: 'row-reverse', gap: 12 },
  cardLabel: { fontSize: font.xs, fontFamily: fam.roundBold, color: colors.text, textAlign: 'right' },
  cardNum: { fontSize: 44, fontFamily: fam.round, color: colors.text, textAlign: 'right', marginTop: 2 },
  cardSub: { fontSize: 13, fontFamily: fam.roundMedium, color: colors.text, opacity: 0.65, textAlign: 'right' },
  cardImg: { width: '100%', height: 96, borderRadius: 18, marginTop: 10, backgroundColor: '#fff' },
  arrowBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#221C46',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', marginTop: 10,
  },
  arrowTxt: { color: '#fff', fontSize: 20, fontWeight: '900' },
  winTitle: { fontSize: font.sm, fontFamily: fam.round, color: colors.text, textAlign: 'right' },
  winSub: { fontSize: font.xs, fontFamily: fam.roundMedium, color: colors.muted, textAlign: 'right', marginTop: 2 },
  tabBar: {
    flexDirection: 'row-reverse', backgroundColor: '#221C46', borderRadius: 999,
    padding: 8, marginTop: 6, marginBottom: 10, justifyContent: 'space-around',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  tab: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: colors.purpleSoft },
  tabTxt: { fontSize: 24 },
});
