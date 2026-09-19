import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, font, fam } from '../theme';
import { getAgeGroup, VOCAB_TOPIC_META } from '../data/ageGroups';
import AppHeader from '../components/AppHeader';
import ScreenShell from '../components/ScreenShell';
import WaveCard from '../components/WaveCard';
import { IMAGES } from '../utils/images';

const CARD_COLORS = [colors.pinkSoft, colors.yellowSoft, colors.purpleSoft, colors.blueSoft, colors.bgAlt];

export default function VocabMenuScreen({ route, navigation }) {
  const profile = route.params?.profile;
  const group = getAgeGroup(profile?.ageGroupId);

  return (
    <ScreenShell
      header={
        <AppHeader
          title="الكلمات 📚"
          subtitle={`المناسب لسن ${group.label}`}
          mascotImage={IMAGES.mascotOwl}
          showBack
          backTo="Home"
          backParams={{ profile }}
          navigation={navigation}
        />
      }
    >
      <WaveCard bg={colors.pinkSoft} style={{ minHeight: 0 }}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
          <Image source={IMAGES.vocab} style={{ width: 96, height: 96 }} contentFit="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.h}>اختار الموضوع</Text>
            <Text style={styles.sub}>عربي وإنجليزي مع صور 🎨</Text>
          </View>
        </View>
      </WaveCard>

      {group.vocabTopics.map((t, i) => {
        const meta = VOCAB_TOPIC_META[t];
        return (
          <WaveCard
            key={t}
            bg={CARD_COLORS[i % CARD_COLORS.length]}
            onPress={() => navigation.navigate('VocabPlay', { profile, topic: t })}
            style={{ minHeight: 0 }}
          >
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{group.label}</Text>
                <Text style={styles.title}>{meta.emoji} {meta.label}</Text>
              </View>
              <View style={styles.arrow}>
                <Text style={styles.arrowTxt}>←</Text>
              </View>
            </View>
          </WaveCard>
        );
      })}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: font.md, fontFamily: fam.round, color: colors.text, textAlign: 'right' },
  sub: { fontSize: font.xs, fontFamily: fam.roundMedium, color: colors.muted, textAlign: 'right', marginTop: 2 },
  label: { fontSize: font.xs, fontFamily: fam.roundMedium, color: colors.muted, textAlign: 'right' },
  title: { fontSize: font.md, fontFamily: fam.round, color: colors.text, textAlign: 'right', marginTop: 2 },
  arrow: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#221C46',
    alignItems: 'center', justifyContent: 'center',
  },
  arrowTxt: { fontSize: 22, fontWeight: '900', color: '#fff' },
});
