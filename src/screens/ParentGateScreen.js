import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
} from 'react-native';
import { colors, font, fam, space, radius, clay } from '../theme';
import { AGE_GROUPS } from '../data/ageGroups';
import { storage } from '../utils/storage';
import { tap, speakAr } from '../utils/speech';
import BigButton from '../components/BigButton';
import Mascot from '../components/Mascot';
import ScreenShell from '../components/ScreenShell';

export default function ParentGateScreen({ navigation }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const start = async () => {
    if (!selected) {
      setError('لازم تختار الفئة العمرية الأول 🙂');
      speakAr('لازم تختار الفئة العمرية الأول');
      return;
    }
    try {
      const profile = {
        name: name.trim() || 'صديقي',
        ageGroupId: selected,
        createdAt: Date.now(),
      };
      await storage.saveProfile(profile);
      navigation.replace('Home', { profile });
    } catch (e) {
      setError('حصلت مشكلة، حاول تاني 🙏');
    }
  };

  return (
    <ScreenShell>
      <View style={styles.head}>
        <Mascot emoji="👨‍👩‍👧" size={60} colors={['#FFFFFF', colors.bgAlt]} />
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
          <Pressable
            key={g.id}
            onPress={() => { tap(); setSelected(g.id); setError(''); }}
            android_ripple={{ color: g.soft }}
            style={({ pressed }) => [
              styles.ageCard,
              { borderColor: g.color },
              active && { backgroundColor: g.color, borderColor: g.color },
              pressed && !active && { backgroundColor: g.soft },
            ]}
          >
            <Text style={styles.ageEmoji}>{g.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ageLabel, active && { color: colors.textLight }]}>
                {g.label}
              </Text>
              <Text style={[styles.ageDesc, active && { color: colors.textLight, opacity: 0.92 }]}>
                {g.description}
              </Text>
            </View>
            {active && <Text style={styles.check}>✓</Text>}
          </Pressable>
        );
      })}

      <BigButton
        emoji="🚀"
        title="ابدأ اللعب"
        color={colors.green}
        onPress={start}
        style={{ marginTop: space.sm }}
      />

      {!!error && (
        <View style={styles.errBox}>
          <Text style={styles.errTxt}>⚠️ {error}</Text>
        </View>
      )}

      <Text style={styles.foot}>💡 تقدر تغيّر السن من إعدادات الأهل في الرئيسية</Text>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', marginBottom: space.xl },
  emoji: { fontSize: 64 },
  title: {
    fontSize: font.lg, fontFamily: fam.round, color: colors.text,
    textAlign: 'center', marginTop: space.sm,
  },
  sub: {
    fontSize: font.xs, fontFamily: fam.roundMedium, color: colors.text, opacity: 0.7,
    textAlign: 'center', marginTop: space.sm, lineHeight: 24,
  },
  label: {
    fontSize: font.sm, fontFamily: fam.roundBold, color: colors.text,
    marginBottom: space.sm, textAlign: 'right',
  },
  input: {
    backgroundColor: colors.cardBg, borderWidth: clay.border, borderColor: colors.cardBorder,
    borderBottomWidth: clay.edge, borderBottomColor: colors.clayEdge,
    borderRadius: radius.md, padding: space.md, fontSize: font.sm, color: colors.text,
  },
  ageCard: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: colors.cardBg, borderWidth: clay.border, borderRadius: radius.lg,
    borderBottomWidth: clay.edge, borderBottomColor: colors.clayEdge,
    padding: space.md, marginBottom: space.md, gap: space.md, minHeight: 88,
  },
  ageEmoji: { fontSize: 40 },
  ageLabel: {
    fontSize: font.md, fontFamily: fam.round, color: colors.text, textAlign: 'right',
  },
  ageDesc: {
    fontSize: font.xs, fontFamily: fam.roundMedium, color: colors.muted,
    textAlign: 'right', marginTop: 4,
  },
  check: {
    fontSize: 28, color: colors.textLight, fontWeight: '900',
    backgroundColor: 'rgba(255,255,255,0.3)', width: 44, height: 44,
    textAlign: 'center', textAlignVertical: 'center', borderRadius: 22, overflow: 'hidden',
  },
  errBox: {
    backgroundColor: '#FFE3E3', borderWidth: 2, borderColor: colors.error,
    borderRadius: radius.md, padding: space.md, marginTop: space.md,
  },
  errTxt: {
    fontSize: font.sm, fontFamily: fam.roundBold, color: colors.error, textAlign: 'center',
  },
  foot: {
    textAlign: 'center', color: colors.muted, fontSize: font.xs,
    fontFamily: fam.roundMedium, marginTop: space.lg,
  },
});
