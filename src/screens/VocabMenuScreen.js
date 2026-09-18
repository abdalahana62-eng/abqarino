import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, font, fam, space } from '../theme';
import { getAgeGroup, VOCAB_TOPIC_META } from '../data/ageGroups';
import BigButton from '../components/BigButton';
import BackButton from '../components/BackButton';
import ScreenShell from '../components/ScreenShell';

export default function VocabMenuScreen({ route, navigation }) {
  const profile = route.params?.profile;
  const group = getAgeGroup(profile?.ageGroupId);

  return (
    <ScreenShell>
      <BackButton to="Home" routeParams={{ profile }} navigation={navigation} />
      <Text style={styles.h}>اختار الموضوع 📚</Text>
      <Text style={styles.sub}>المناسب لسن {group.label}</Text>

      {group.vocabTopics.map((t) => {
        const meta = VOCAB_TOPIC_META[t];
        const darkInk = t === 'colors';
        return (
          <BigButton
            key={t}
            emoji={meta.emoji}
            title={meta.label}
            color={meta.color}
            ink={darkInk ? colors.text : colors.textLight}
            onPress={() => navigation.navigate('VocabPlay', { profile, topic: t })}
          />
        );
      })}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  h: {
    fontSize: font.lg, fontFamily: fam.round, color: colors.text,
    textAlign: 'right', marginTop: space.md,
  },
  sub: {
    fontSize: font.xs, fontFamily: fam.roundMedium, color: colors.muted, textAlign: 'right',
    marginBottom: space.lg, marginTop: 4,
  },
});
