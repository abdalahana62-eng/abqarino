import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors, font, weight, space } from '../theme';
import { getAgeGroup, VOCAB_TOPIC_META } from '../data/ageGroups';
import BigButton from '../components/BigButton';

export default function VocabMenuScreen({ route, navigation }) {
  const profile = route.params?.profile;
  const group = getAgeGroup(profile?.ageGroupId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.c}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backTxt}>← رجوع</Text>
        </TouchableOpacity>

        <Text style={styles.h}>اختار الموضوع 📚</Text>
        <Text style={styles.sub}>المناسب لسن {group.label}</Text>

        {group.vocabTopics.map((t) => {
          const meta = VOCAB_TOPIC_META[t];
          return (
            <BigButton
              key={t}
              emoji={meta.emoji}
              title={meta.label}
              color={meta.color}
              onPress={() => navigation.navigate('VocabPlay', { profile, topic: t })}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { padding: space.lg, flexGrow: 1 },
  back: { alignSelf: 'flex-end', padding: space.sm },
  backTxt: { fontSize: font.sm, fontWeight: weight.bold, color: colors.text },
  h: {
    fontSize: font.lg, fontWeight: weight.black, color: colors.text,
    textAlign: 'right', marginTop: space.md,
  },
  sub: {
    fontSize: font.xs, color: colors.muted, textAlign: 'right',
    marginBottom: space.lg, marginTop: 4,
  },
});
