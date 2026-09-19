import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, font, fam, space } from '../theme';
import { getAgeGroup, MATH_TOPIC_META } from '../data/ageGroups';
import AppHeader from '../components/AppHeader';
import TopicCard from '../components/TopicCard';
import ScreenShell from '../components/ScreenShell';

export default function MathMenuScreen({ route, navigation }) {
  const profile = route.params?.profile;
  const group = getAgeGroup(profile?.ageGroupId);

  return (
    <ScreenShell
      header={
        <AppHeader
          title="الحساب 🔢"
          subtitle={`المناسب لسن ${group.label}`}
          mascot="🦊"
          showBack
          backTo="Home"
          backParams={{ profile }}
          navigation={navigation}
        />
      }
    >
      <Text style={styles.h}>اختار الموضوع</Text>

      {group.mathTopics.map((t) => {
        const meta = MATH_TOPIC_META[t];
        return (
          <TopicCard
            key={t}
            emoji={meta.emoji}
            label={group.label}
            title={meta.label}
            color={meta.color}
            onPress={() => navigation.navigate('MathPlay', { profile, topic: t })}
          />
        );
      })}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  h: {
    fontSize: font.md, fontFamily: fam.round, color: colors.text,
    textAlign: 'right', marginTop: space.sm, marginBottom: space.md,
  },
});
