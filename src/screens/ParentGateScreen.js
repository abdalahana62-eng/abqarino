import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { colors, font, fam, space, radius, clay } from '../theme';
import { AGE_GROUPS } from '../data/ageGroups';
import { storage } from '../utils/storage';
import { speakAr } from '../utils/speech';
import BigButton from '../components/BigButton';
import TopicCard from '../components/TopicCard';
import AppHeader from '../components/AppHeader';
import ScreenShell from '../components/ScreenShell';
import { IMAGES } from '../utils/images';

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
    <ScreenShell
      header={
        <AppHeader
          title="أهلًا بيكم في عبقرينو"
          subtitle="الأهل بس اللي يملأوا البيانات دي 💛"
          mascotImage={IMAGES.mascotOwl}
        />
      }
    >
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

      {AGE_GROUPS.map((g) => (
        <TopicCard
          key={g.id}
          emoji={g.emoji}
          label={g.description}
          title={g.label}
          color={g.color}
          soft={g.soft}
          selected={selected === g.id}
          onPress={() => { setSelected(g.id); setError(''); }}
        />
      ))}

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
  label: {
    fontSize: font.sm, fontFamily: fam.roundBold, color: colors.text,
    marginBottom: space.sm, textAlign: 'right',
  },
  input: {
    backgroundColor: colors.cardBg, borderWidth: clay.border, borderColor: colors.cardBorder,
    borderBottomWidth: clay.edge, borderBottomColor: colors.clayEdge,
    borderRadius: radius.md, padding: space.md, fontSize: font.sm, color: colors.text,
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
