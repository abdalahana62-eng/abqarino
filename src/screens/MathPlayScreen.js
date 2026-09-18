import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { colors, font, weight, space, radius } from '../theme';
import { getAgeGroup, MATH_TOPIC_META } from '../data/ageGroups';
import { generateMathQuestion } from '../data/math';
import { storage } from '../utils/storage';
import { speakAr, hapticSuccess, hapticError, stopSpeech, tap } from '../utils/speech';

const ROUND = 8;

export default function MathPlayScreen({ route, navigation }) {
  const { profile, topic } = route.params;
  const group = getAgeGroup(profile?.ageGroupId);
  const meta = MATH_TOPIC_META[topic];

  const [q, setQ] = useState(null);
  const [picked, setPicked] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);

  const next = useCallback(() => {
    setQ(generateMathQuestion(topic, group));
    setPicked(null);
  }, [topic, group]);

  useEffect(() => { next(); return () => stopSpeech(); }, [next]);

  const onPick = async (choice) => {
    if (picked !== null) return;
    setPicked(choice);
    if (String(choice) === String(q.answer)) {
      hapticSuccess();
      speakAr('برافو!');
      setCorrectCount((c) => c + 1);
      setStars((s) => s + 1);
      await storage.addStars(topic, 1);
    } else {
      hapticError();
      speakAr(`الإجابة الصح ${q.answer}`);
      setWrongCount((w) => w + 1);
      await storage.addStars(topic, 0);
    }
    setTimeout(() => {
      if (index + 1 >= ROUND) {
        setDone(true);
        storage.bumpSession();
      } else {
        setIndex((i) => i + 1);
        next();
      }
    }, 1400);
  };

  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={styles.result}>
          <Text style={{ fontSize: 100 }}>🏆</Text>
          <Text style={styles.resultH}>شغل عظيم!</Text>
          <Text style={styles.resultSub}>
            جبت {correctCount} إجابة صح من {ROUND}
          </Text>
          <Text style={styles.resultStars}>⭐ {stars} نجمة</Text>
          <TouchableOpacity
            style={[styles.bigBtn, { backgroundColor: meta.color }]}
            onPress={() => {
              setIndex(0); setCorrectCount(0); setWrongCount(0); setStars(0);
              setDone(false); next();
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

        <View style={[styles.badge, { backgroundColor: meta.color }]}>
          <Text style={styles.badgeTxt}>{meta.emoji} {meta.label}</Text>
        </View>

        <View style={styles.questionBox}>
          {q.visual?.type === 'emojis' && (
            <View style={styles.emojiGrid}>
              {Array.from({ length: q.visual.count }).map((_, i) => (
                <Text key={i} style={styles.gridEmoji}>{q.visual.emoji}</Text>
              ))}
            </View>
          )}

          {q.visual?.type === 'fraction' && (
            <View style={styles.fractionWrap}>
              {Array.from({ length: q.visual.denominator }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.fractionCell,
                    { backgroundColor: i < q.visual.numerator ? meta.color : '#EDEDED' },
                  ]}
                />
              ))}
            </View>
          )}

          <Text style={styles.question}>{q.question}</Text>

          <TouchableOpacity onPress={() => speakAr(q.speak || q.question)} style={styles.speakBtn}>
            <Text style={styles.speakTxt}>🔊 اسمع السؤال</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.choices}>
          {q.choices.map((c) => {
            const isCorrect = String(c) === String(q.answer);
            const isPicked = String(c) === String(picked);
            let bg = colors.cardBg;
            if (picked !== null && isCorrect) bg = colors.success;
            else if (isPicked && !isCorrect) bg = colors.error;
            return (
              <TouchableOpacity
                key={String(c)}
                activeOpacity={0.85}
                onPress={() => { tap(); onPick(c); }}
                style={[styles.choice, { backgroundColor: bg }]}
              >
                <Text style={[
                  styles.choiceTxt,
                  (picked !== null && (isCorrect || isPicked)) && { color: colors.textLight },
                ]}>
                  {c}
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

  badge: {
    alignSelf: 'center', paddingHorizontal: space.md, paddingVertical: 6,
    borderRadius: radius.round, marginTop: space.sm,
  },
  badgeTxt: { color: colors.textLight, fontWeight: weight.black, fontSize: font.xs },

  questionBox: {
    backgroundColor: colors.cardBg, borderRadius: radius.xl, padding: space.lg,
    marginTop: space.md, alignItems: 'center',
    shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  emojiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    marginBottom: space.md,
  },
  gridEmoji: { fontSize: 40, margin: 4 },
  fractionWrap: {
    flexDirection: 'row', width: 260, height: 60,
    borderRadius: radius.md, overflow: 'hidden', marginBottom: space.md,
    borderWidth: 2, borderColor: '#DDD',
  },
  fractionCell: { flex: 1, borderRightWidth: 1, borderRightColor: '#DDD' },
  question: {
    fontSize: font.lg, fontWeight: weight.black, color: colors.text,
    textAlign: 'center', lineHeight: 44,
  },
  speakBtn: {
    marginTop: space.md, backgroundColor: colors.accent,
    paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.round,
  },
  speakTxt: { fontWeight: weight.black, color: colors.text, fontSize: font.xs },

  choices: {
    marginTop: space.lg, flexDirection: 'row-reverse', flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  choice: {
    width: '48%', paddingVertical: space.lg, marginBottom: space.md,
    borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.cardBorder,
  },
  choiceTxt: {
    fontSize: font.lg, fontWeight: weight.black, color: colors.text,
  },

  result: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  resultH: {
    fontSize: font.xl, fontWeight: weight.black, color: colors.text, marginTop: space.md,
  },
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
