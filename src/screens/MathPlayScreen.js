import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font, fam, space, radius, clay } from '../theme';
import { getAgeGroup, MATH_TOPIC_META } from '../data/ageGroups';
import { generateMathQuestion } from '../data/math';
import { storage } from '../utils/storage';
import { speakAr, hapticSuccess, hapticError, stopSpeech, tap } from '../utils/speech';
import BigButton from '../components/BigButton';
import { Image } from 'expo-image';
import { IMAGES } from '../utils/images';
import BackButton from '../components/BackButton';
import ScreenShell from '../components/ScreenShell';

const ROUND = 8;

export default function MathPlayScreen({ route, navigation }) {
  const { profile, topic } = route.params;
  const group = getAgeGroup(profile?.ageGroupId);
  const meta = MATH_TOPIC_META[topic];

  const [q, setQ] = useState(null);
  const [picked, setPicked] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);

  const next = useCallback(() => {
    setQ(generateMathQuestion(topic, group));
    setPicked(null);
  }, [topic, group]);

  useEffect(() => { next(); return () => stopSpeech(); }, [next]);

  const replay = () => {
    setIndex(0); setCorrectCount(0); setStars(0);
    setDone(false); next();
  };

  const onPick = async (choice) => {
    if (picked !== null) return;
    setPicked(choice);
    if (String(choice) === String(q.answer)) {
      hapticSuccess();
      speakAr('برافو! إجابة صحيحة');
      setCorrectCount((c) => c + 1);
      setStars((s) => s + 1);
      await storage.addStars(topic, 1);
    } else {
      hapticError();
      speakAr(`الإجابة الصحيحة ${q.answer}`);
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
    }, 1500);
  };

  if (done) {
    return (
      <ScreenShell>
        <View style={styles.result}>
          <Image source={IMAGES.win} style={{ width: 200, height: 200, borderRadius: 32 }} contentFit="cover" />
          <Text style={styles.resultH}>شغل عظيم!</Text>
          <Text style={styles.resultSub}>
            جبت {correctCount} إجابة صح من {ROUND}
          </Text>
          <Text style={styles.resultStars}>⭐ {stars} نجمة</Text>
          <BigButton emoji="🔁" title="العب تاني" color={meta.color} onPress={replay} />
          <BigButton
            emoji="✅"
            title="رجوع للقائمة"
            color={colors.green}
            onPress={() => navigation.navigate('MathMenu', { profile })}
          />
        </View>
      </ScreenShell>
    );
  }

  if (!q) return null;

  return (
    <ScreenShell>
      <View style={styles.topBar}>
        <BackButton to="MathMenu" navigation={navigation} routeParams={{ profile }} />
        <Text style={styles.progress}>{index + 1} / {ROUND}</Text>
        <View style={styles.sideRow}>
          <Pressable
            onPress={() => { tap(); navigation.navigate('Home', { profile }); }}
            hitSlop={12}
            android_ripple={{ color: colors.cardBorder }}
            style={({ pressed }) => [styles.homeBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.homeTxt}>🏠</Text>
          </Pressable>
          <Text style={styles.starCount}>⭐ {stars}</Text>
        </View>
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

        <Pressable
          onPress={() => { tap(); speakAr(q.speak || q.question); }}
          android_ripple={{ color: colors.clayEdge }}
          style={({ pressed }) => [styles.speakBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.speakTxt}>🔊 اسمع السؤال</Text>
        </Pressable>
      </View>

      <View style={styles.choices}>
        {q.choices.map((c) => {
          const isCorrect = String(c) === String(q.answer);
          const isPicked = String(c) === String(picked);
          let bg = colors.cardBg;
          let ink = colors.text;
          if (picked !== null && isCorrect) { bg = colors.success; ink = colors.textLight; }
          else if (isPicked && !isCorrect) { bg = colors.error; ink = colors.textLight; }
          return (
            <Pressable
              key={String(c)}
              onPress={() => { tap(); onPick(c); }}
              android_ripple={{ color: colors.clayEdge }}
              style={({ pressed }) => [
                styles.choice,
                { backgroundColor: bg },
                pressed && picked === null && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <Text style={[styles.choiceTxt, { color: ink }]}>{c}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  sideRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: space.sm },
  homeBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.cardBg, borderWidth: clay.border, borderColor: colors.cardBorder,
    borderBottomWidth: 4, borderBottomColor: colors.clayEdge,
    alignItems: 'center', justifyContent: 'center',
  },
  homeTxt: { fontSize: 24 },
  progress: { fontSize: font.sm, fontFamily: fam.round, color: colors.muted },
  starCount: { fontSize: font.sm, fontFamily: fam.round, color: colors.orange },

  badge: {
    alignSelf: 'center', paddingHorizontal: space.md, paddingVertical: 6,
    borderRadius: radius.round, marginTop: space.sm,
    borderBottomWidth: 3, borderBottomColor: colors.clayEdge,
  },
  badgeTxt: { color: colors.textLight, fontFamily: fam.round, fontSize: font.xs },

  questionBox: {
    backgroundColor: colors.cardBg, borderWidth: clay.border, borderColor: colors.cardBorder,
    borderBottomWidth: clay.edge, borderBottomColor: colors.clayEdge,
    borderRadius: radius.xl, padding: space.lg,
    marginTop: space.md, alignItems: 'center',
    shadowColor: '#0F172A', shadowOpacity: 0.1, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },
  emojiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    marginBottom: space.md,
  },
  gridEmoji: { fontSize: 40, margin: 4 },
  fractionWrap: {
    flexDirection: 'row', width: 260, height: 60,
    borderRadius: radius.md, overflow: 'hidden', marginBottom: space.md,
    borderWidth: 3, borderColor: colors.cardBorder,
  },
  fractionCell: { flex: 1, borderRightWidth: 1, borderRightColor: colors.cardBorder },
  question: {
    fontSize: font.lg, fontFamily: fam.round, color: colors.text,
    textAlign: 'center', lineHeight: 46,
  },
  speakBtn: {
    marginTop: space.md, backgroundColor: colors.accent,
    paddingHorizontal: space.md, paddingVertical: 10, borderRadius: radius.round,
    borderBottomWidth: 4, borderBottomColor: colors.clayEdge,
    minHeight: 48, justifyContent: 'center',
  },
  speakTxt: { fontFamily: fam.round, color: colors.textLight, fontSize: font.xs },

  choices: {
    marginTop: space.lg, flexDirection: 'row-reverse', flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  choice: {
    width: '48%', paddingVertical: space.lg, marginBottom: space.md,
    borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    borderWidth: clay.border, borderColor: colors.cardBorder,
    borderBottomWidth: clay.edge, borderBottomColor: colors.clayEdge,
    minHeight: 88,
  },
  choiceTxt: { fontSize: font.lg, fontFamily: fam.round },

  result: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resultH: { fontSize: font.xl, fontFamily: fam.round, color: colors.text, marginTop: space.md },
  resultSub: { fontSize: font.md, fontFamily: fam.roundMedium, color: colors.text, marginTop: space.sm },
  resultStars: {
    fontSize: font.lg, fontFamily: fam.round, color: colors.orange, marginTop: space.md,
    marginBottom: space.md,
  },
});
