import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font, fam, space, radius, clay } from '../theme';
import { getAgeGroup, MATH_TOPIC_META } from '../data/ageGroups';
import { generateMathQuestion } from '../data/math';
import { storage } from '../utils/storage';
import { tap, stopSpeech, hapticSuccess, hapticError } from '../utils/speech';
import { playKey, playSeq, stopVoice, keys, questionKeys, explainKeys, teachSteps } from '../utils/voice';
import BigButton from '../components/BigButton';
import { Image } from 'expo-image';
import { IMAGES } from '../utils/images';
import DragCountGame, { DRAG_THEMES } from '../components/DragCountGame';
import BackButton from '../components/BackButton';
import ScreenShell from '../components/ScreenShell';

const ROUND = 8;

// One fixed easy demo per topic: the lesson teaches WITH the kid before quizzing.
const DEMO = {
  counting: { n: 4, ans: 4 },
  addition: { a: 3, b: 2, ans: 5 },
  subtraction: { a: 5, b: 2, ans: 3 },
  multiplication: { a: 2, b: 3, ans: 6 },
  division: { a: 6, b: 2, ans: 3 },
  fractions: { num: 1, den: 2, ans: '1/2' },
  wordProblems: { a: 2, b: 2, ans: 4 },
};

export default function MathPlayScreen({ route, navigation }) {
  const { profile, topic } = route.params;
  const group = getAgeGroup(profile?.ageGroupId);
  const meta = MATH_TOPIC_META[topic];
  const kidName = profile?.name || 'صديقي';

  const [q, setQ] = useState(null);
  const [picked, setPicked] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [teach, setTeach] = useState(null); // { steps } | null
  const [phase, setPhase] = useState('lesson'); // lesson first, quiz after
  const lesson = useMemo(
    () => teachSteps(topic, DEMO[topic] || DEMO.addition, (i) => DRAG_THEMES[i % DRAG_THEMES.length]),
    [topic]
  );

  const next = useCallback(() => {
    setQ(generateMathQuestion(topic, group));
    setPicked(null);
  }, [topic, group]);

  useEffect(() => { next(); return () => { stopSpeech(); stopVoice(); }; }, [next]);

  const advance = useCallback(() => {
    if (index + 1 >= ROUND) {
      setDone(true);
      storage.bumpSession();
    } else {
      setIndex((i) => i + 1);
      next();
    }
  }, [index, next]);

  // Teacher reads every quiz question out loud (lesson has its own audio).
  const greeted = useRef(false);
  const qKey = useRef(0);
  useEffect(() => {
    if (!q || teach || phase !== 'quiz') return;
    const my = ++qKey.current;
    (async () => {
      if (!greeted.current) {
        greeted.current = true;
        await playSeq([keys.greet()]);
      }
      if (my !== qKey.current) return;
      await playSeq(questionKeys(topic, q.parts || {}));
    })();
  }, [q, teach, phase, topic]);

  // Farewell when the round ends.
  useEffect(() => {
    if (done) {
      const good = correctCount >= ROUND / 2;
      playSeq([{
        key: good ? 'bye_good' : 'bye_try',
        fb: { kind: 'ar', text: good ? 'لعب جميل يا بطل! عبقرينو فخور بيك!' : 'حاولت كويس يا بطل! العب تاني وهتبقى أحسن!' },
      }]);
    }
  }, [done, correctCount]);

  const replay = () => {
    setIndex(0); setCorrectCount(0); setStars(0);
    setDone(false); setPhase('quiz'); setTeach(null); next();
  };

  // Interactive lesson for THE SAME failed problem (null = too big → verbal).
  const onPick = async (choice) => {
    if (picked !== null || teach) return;
    setPicked(choice);
    if (String(choice) === String(q.answer)) {
      hapticSuccess();
      await storage.addStars(topic, 1);
      setCorrectCount((c) => c + 1);
      setStars((s) => s + 1);
      await playSeq([keys.praise()]);
      advance();
    } else {
      hapticError();
      await storage.addStars(topic, 0);
      const steps = teachSteps(topic, q.parts, (i) => DRAG_THEMES[(index + i) % DRAG_THEMES.length]);
      if (steps) {
        setTeach({ steps });
        await playSeq([keys.encourage()]);
      } else {
        // Big numbers: verbal step-by-step explanation, then move on.
        await playSeq(explainKeys(topic, q.parts || { ans: q.answer }));
        advance();
      }
    }
  };

  const handleLessonStep = (si, info) => {
    if (!lesson) return;
    if (info === 'miss') {
      playKey('t_tryagain', { kind: 'ar', text: 'حاول تاني يا بطل، حطها جوه السلة!' });
      return;
    }
    playSeq(lesson[si].say);
  };

  const finishLesson = async (withPraise) => {
    if (withPraise) await playSeq([keys.praise()]);
    setPhase('quiz');
  };

  // Lesson greeting (once).
  const lessonStarted = useRef(false);
  useEffect(() => {
    if (phase === 'lesson' && lesson && !lessonStarted.current) {
      lessonStarted.current = true;
      playSeq([
        keys.greet(),
        { key: 'lesson_intro', fb: { kind: 'ar', text: 'يلا نتعلم الأول وبعدين نلعب!' } },
      ]);
    }
  }, [phase, lesson]);

  const handleStep = (si, info) => {
    const steps = teach?.steps;
    if (!steps) return;
    if (info === 'miss') {
      playKey('t_tryagain', { kind: 'ar', text: 'حاول تاني يا بطل، حطها جوه السلة!' });
      return;
    }
    playSeq(steps[si].say);
  };

  const closeTeach = async (withPraise) => {
    const tail = teach?.steps?.tail;
    setTeach(null);
    if (withPraise) {
      if (tail) await playSeq(tail);
      await playSeq([keys.praise()]);
    }
    advance();
  };

  if (done) {
    return (
      <ScreenShell>
        <View style={styles.result}>
          <Image source={IMAGES.win} style={{ width: 220, height: 220 }} contentFit="contain" />
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
    <ScreenShell scrollEnabled={!teach}>
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

      {phase === 'lesson' && lesson ? (
        <View style={styles.teachCard}>
          <Text style={styles.teachTitle}>📖 درس الأول: اتعلم وبعدين العب</Text>
          <DragCountGame
            steps={lesson}
            onStep={handleLessonStep}
            onCount={(n) => { playKey(keys.num(n) || '__missing__', { kind: 'ar', text: String(n) }); }}
            onDone={() => finishLesson(true)}
            onSkip={async () => { await stopVoice(); finishLesson(false); }}
          />
        </View>
      ) : teach ? (
        <View style={styles.teachCard}>
          <Text style={styles.teachTitle}>تعال نحلها باللعب 🎮</Text>
          <DragCountGame
            steps={teach.steps}
            onStep={handleStep}
            onCount={(n) => { playKey(keys.num(n) || '__missing__', { kind: 'ar', text: String(n) }); }}
            onDone={() => closeTeach(true)}
            onSkip={async () => { await stopVoice(); closeTeach(false); }}
          />
        </View>
      ) : (
      <>
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
          onPress={() => { tap(); playSeq(questionKeys(topic, q.parts || {})); }}
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
      </>
      )}
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
  teachCard: {
    backgroundColor: colors.cardBg, borderWidth: clay.border, borderColor: colors.cardBorder,
    borderBottomWidth: clay.edge, borderBottomColor: colors.clayEdge,
    borderRadius: radius.xl, padding: space.md, marginTop: space.md,
  },
  teachTitle: {
    fontSize: font.md, fontFamily: fam.round, color: colors.text,
    textAlign: 'center', marginBottom: space.sm,
  },  resultH: { fontSize: font.xl, fontFamily: fam.round, color: colors.text, marginTop: space.md },
  resultSub: { fontSize: font.md, fontFamily: fam.roundMedium, color: colors.text, marginTop: space.sm },
  resultStars: {
    fontSize: font.lg, fontFamily: fam.round, color: colors.orange, marginTop: space.md,
    marginBottom: space.md,
  },
});
