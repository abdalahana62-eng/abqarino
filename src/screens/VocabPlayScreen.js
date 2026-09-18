import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { colors, font, weight, space, radius } from '../theme';
import { VOCAB_TOPIC_META, getAgeGroup } from '../data/ageGroups';
import { VOCAB, getRandomItem, shuffle } from '../data/vocab';
import { storage } from '../utils/storage';
import { speakAr, speakEn, hapticSuccess, hapticError, stopSpeech, tap } from '../utils/speech';

const ROUND = 8;

export default function VocabPlayScreen({ route, navigation }) {
  const { profile, topic } = route.params;
  const group = getAgeGroup(profile?.ageGroupId);
  const meta = VOCAB_TOPIC_META[topic];
  const pool = VOCAB[topic] || [];

  const [lang, setLang] = useState('ar'); // 'ar' | 'en'
  const [q, setQ] = useState(null);
  const [picked, setPicked] = useState(null);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [stars, setStars] = useState(0);
  const [done, setDone] = useState(false);

  const next = useCallback(() => {
    if (!pool.length) return;
    const target = getRandomItem(pool);
    // 3 options غير صحيحة
    const wrongs = shuffle(pool.filter((p) => p.en !== target.en)).slice(0, 3);
    const options = shuffle([target, ...wrongs]).map((o) => ({
      key: o.en,
      text: lang === 'ar' ? o.ar : o.en,
    }));
    setQ({ target, options });
    setPicked(null);
  }, [pool, lang]);

  useEffect(() => {
    if (pool.length) next();
    return () => stopSpeech();
  }, [next, pool.length, lang]);

  const onPick = async (opt) => {
    if (picked !== null) return;
    setPicked(opt.key);
    const isCorrect = opt.key === q.target.en;
    if (isCorrect) {
      hapticSuccess();
      speakAr('برافو!');
      setTimeout(() => {
        if (lang === 'ar') speakAr(q.target.ar);
        else speakEn(q.target.en);
      }, 500);
      setCorrectCount((c) => c + 1);
      setStars((s) => s + 1);
      await storage.addStars(`vocab-${topic}`, 1);
    } else {
      hapticError();
      speakAr('حاول تاني المرة الجاية');
      await storage.addStars(`vocab-${topic}`, 0);
    }
    setTimeout(() => {
      if (index + 1 >= ROUND) {
        setDone(true);
        storage.bumpSession();
      } else {
        setIndex((i) => i + 1);
        next();
      }
    }, 1600);
  };

  const learnWord = () => {
    if (!q) return;
    speakAr(q.target.ar);
    setTimeout(() => speakEn(q.target.en), 900);
  };

  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={styles.result}>
          <Text style={{ fontSize: 100 }}>🎉</Text>
          <Text style={styles.resultH}>شغل عظيم!</Text>
          <Text style={styles.resultSub}>جبت {correctCount} إجابة صح من {ROUND}</Text>
          <Text style={styles.resultStars}>⭐ {stars} نجمة</Text>
          <TouchableOpacity
            style={[styles.bigBtn, { backgroundColor: meta.color }]}
            onPress={() => {
              setIndex(0); setCorrectCount(0); setStars(0); setDone(false); next();
            }}
          >
            <Text style={styles.bigBtnTxt}>العب تاني 🔁</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bigBtn, { backgroundColor: colors.green }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.bigBtnTxt}>رجوع للقائمة ✅</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!q) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.c}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backTxt}>← رجوع</Text>
          </TouchableOpacity>
          <Text style={styles.progress}>{index + 1} / {ROUND}</Text>
          <Text style={styles.starCount}>⭐ {stars}</Text>
        </View>

        <View style={styles.langRow}>
          <TouchableOpacity
            onPress={() => { tap(); setLang('ar'); setIndex(0); setCorrectCount(0); setStars(0); }}
            style={[styles.langBtn, lang === 'ar' && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.langTxt, lang === 'ar' && { color: colors.textLight }]}>عربي 🇪🇬</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { tap(); setLang('en'); setIndex(0); setCorrectCount(0); setStars(0); }}
            style={[styles.langBtn, lang === 'en' && { backgroundColor: colors.secondary }]}
          >
            <Text style={[styles.langTxt, lang === 'en' && { color: colors.textLight }]}>English 🇬🇧</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.badge, { backgroundColor: meta.color }]}>
          <Text style={styles.badgeTxt}>{meta.emoji} {meta.label}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.emoji}>{q.target.emoji}</Text>
          <TouchableOpacity onPress={learnWord} style={styles.learnBtn}>
            <Text style={styles.learnTxt}>🔊 اسمع الكلمة</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.prompt}>
          {lang === 'ar' ? 'اختار الكلمة الصح بالعربي' : 'Choose the right word in English'}
        </Text>

        <View style={styles.choices}>
          {q.options.map((opt) => {
            const isCorrect = opt.key === q.target.en;
            const isPicked = opt.key === picked;
            let bg = colors.cardBg;
            if (picked !== null && isCorrect) bg = colors.success;
            else if (isPicked && !isCorrect) bg = colors.error;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => { tap(); onPick(opt); }}
                activeOpacity={0.85}
                style={[styles.choice, { backgroundColor: bg }]}
              >
                <Text
                  style={[
                    styles.choiceTxt,
                    (picked !== null && (isCorrect || isPicked)) && { color: colors.textLight },
                  ]}
                >
                  {opt.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { padding: space.lg, flexGrow: 1 },
  topBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  back: { padding: space.sm },
  backTxt: { fontSize: font.sm, fontWeight: weight.bold, color: colors.text },
  progress: { fontSize: font.sm, fontWeight: weight.black, color: colors.muted },
  starCount: { fontSize: font.sm, fontWeight: weight.black, color: colors.orange },

  langRow: {
    flexDirection: 'row-reverse', gap: space.sm, justifyContent: 'center',
    marginVertical: space.md,
  },
  langBtn: {
    paddingHorizontal: space.lg, paddingVertical: 8,
    borderRadius: radius.round, borderWidth: 2, borderColor: colors.cardBorder,
    backgroundColor: colors.cardBg,
  },
  langTxt: { fontWeight: weight.black, color: colors.text, fontSize: font.xs },

  badge: {
    alignSelf: 'center', paddingHorizontal: space.md, paddingVertical: 6,
    borderRadius: radius.round, marginBottom: space.md,
  },
  badgeTxt: { color: colors.textLight, fontWeight: weight.black, fontSize: font.xs },

  card: {
    backgroundColor: colors.cardBg, borderRadius: radius.xl, padding: space.xl,
    alignItems: 'center',
    shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  emoji: { fontSize: 140 },
  learnBtn: {
    marginTop: space.md, backgroundColor: colors.accent,
    paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.round,
  },
  learnTxt: { fontWeight: weight.black, color: colors.text, fontSize: font.xs },

  prompt: {
    fontSize: font.md, fontWeight: weight.bold, color: colors.text,
    textAlign: 'center', marginVertical: space.md,
  },

  choices: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
  choice: {
    width: '48%', paddingVertical: space.lg, marginBottom: space.md,
    borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.cardBorder,
  },
  choiceTxt: { fontSize: font.md, fontWeight: weight.black, color: colors.text },

  result: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  resultH: { fontSize: font.xl, fontWeight: weight.black, color: colors.text, marginTop: space.md },
  resultSub: { fontSize: font.md, color: colors.text, marginTop: space.sm },
  resultStars: {
    fontSize: font.lg, fontWeight: weight.black, color: colors.orange, marginTop: space.md,
  },
  bigBtn: {
    marginTop: space.lg, paddingVertical: space.md, paddingHorizontal: space.xl,
    borderRadius: radius.round, minWidth: 220, alignItems: 'center',
  },
  bigBtnTxt: { color: colors.textLight, fontSize: font.md, fontWeight: weight.black },
});
