import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, SafeAreaView,
} from 'react-native';
import { colors, font, weight, space, radius } from '../theme';
import { AGE_GROUPS } from '../data/ageGroups';
import { storage } from '../utils/storage';
import { tap } from '../utils/speech';

export default function ParentGateScreen({ navigation }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(null);

  const start = async () => {
    if (!selected) {
      Alert.alert('اختار سن الطفل', 'لازم تختار الفئة العمرية الأول 🙂');
      return;
    }
    const profile = {
      name: name.trim() || 'صديقي',
      ageGroupId: selected,
      createdAt: Date.now(),
    };
    await storage.saveProfile(profile);
    navigation.replace('Home', { profile });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.c}>
        <View style={styles.head}>
          <Text style={styles.emoji}>👨‍👩‍👧</Text>
          <Text style={styles.title}>أهلًا بيكم في عبقرينو</Text>
          <Text style={styles.sub}>
            الأهل بس اللي يملأوا البيانات دي، وبعدها التطبيق للطفل 💛
          </Text>
        </View>

        <Text style={styles.label}>اسم الطفل (اختياري)</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="مثال: يوسف، مريم..."
          placeholderTextColor={colors.muted}
          style={styles.input}
          textAlign="right"
        />

        <Text style={[styles.label, { marginTop: space.lg }]}>سن الطفل</Text>

        {AGE_GROUPS.map((g) => {
          const active = selected === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              activeOpacity={0.85}
              onPress={() => { tap(); setSelected(g.id); }}
              style={[
                styles.ageCard,
                { borderColor: g.color },
                active && { backgroundColor: g.color },
              ]}
            >
              <Text style={styles.ageEmoji}>{g.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ageLabel, active && { color: colors.textLight }]}>
                  {g.label}
                </Text>
                <Text style={[styles.ageDesc, active && { color: colors.textLight, opacity: 0.9 }]}>
                  {g.description}
                </Text>
              </View>
              {active && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.start} onPress={start} activeOpacity={0.85}>
          <Text style={styles.startTxt}>ابدأ اللعب 🚀</Text>
        </TouchableOpacity>

        <Text style={styles.foot}>💡 تقدر تغيّر السن من إعدادات الأهل في الرئيسية</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { padding: space.lg, paddingTop: space.lg, flexGrow: 1 },
  head: { alignItems: 'center', marginBottom: space.xl },
  emoji: { fontSize: 64 },
  title: {
    fontSize: font.lg, fontWeight: weight.black, color: colors.text,
    textAlign: 'center', marginTop: space.sm,
  },
  sub: {
    fontSize: font.xs, color: colors.text, opacity: 0.7,
    textAlign: 'center', marginTop: space.sm, lineHeight: 24,
  },
  label: {
    fontSize: font.sm, fontWeight: weight.bold, color: colors.text,
    marginBottom: space.sm, textAlign: 'right',
  },
  input: {
    backgroundColor: colors.cardBg, borderWidth: 2, borderColor: colors.cardBorder,
    borderRadius: radius.md, padding: space.md, fontSize: font.sm, color: colors.text,
  },
  ageCard: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: colors.cardBg, borderWidth: 3, borderRadius: radius.lg,
    padding: space.md, marginBottom: space.md, gap: space.md,
  },
  ageEmoji: { fontSize: 40 },
  ageLabel: { fontSize: font.md, fontWeight: weight.bold, color: colors.text, textAlign: 'right' },
  ageDesc: { fontSize: font.xs, color: colors.text, opacity: 0.6, textAlign: 'right', marginTop: 4 },
  check: { fontSize: 30, color: colors.textLight, fontWeight: weight.black },
  start: {
    backgroundColor: colors.green, padding: space.lg, borderRadius: radius.round,
    alignItems: 'center', marginTop: space.lg,
    shadowColor: colors.green, shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  startTxt: { fontSize: font.md, fontWeight: weight.black, color: colors.textLight },
  foot: { textAlign: 'center', color: colors.muted, fontSize: font.xs, marginTop: space.lg },
});
