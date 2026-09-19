import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font, fam, space, radius, clay } from '../theme';
import { VOCAB_TOPIC_META, getAgeGroup } from '../data/ageGroups';
import { VOCAB, getRandomItem, shuffle } from '../data/vocab';
import { storage } from '../utils/storage';
import { tap, stopSpeech, hapticSuccess, hapticError } from '../utils/speech';
import { playKey, playSeq, stopVoice, keys, vocabKeys } from '../utils/voice';
import { stopAllAudio } from '../logic/teachAudio.js';
import { roundsForAge, ageMinOf, choicesForAge } from '../logic/difficulty.js';
import { buildWordOptions } from '../logic/wordQuestions.js';
import { wordDisplay } from '../content/words/meta.js';
import { isListeningSupported, listenOnce, matchesSpoken } from '../utils/speechRec';
import BigButton from '../components/BigButton';
import { Image } from 'expo-image';
import { IMAGES } from '../utils/images';
import BackButton from '../components/BackButton';
import ScreenShell from '../components/ScreenShell';

export default function VocabPlayScreen({ route, navigation }) {
  const { profile, topic } = route.params;
  const ROUND = roundsForAge(ageMinOf(profile?.ageGroupId));
  const group = getAgeGroup(profile?.ageGroupId);
  const meta = VOCAB_TOPIC_META[topic];
  const pool = VOCAB[topic] || [];
  const kidName = profile?.name || 'صديقي';

  const [lang, setLang] = useState('ar'); // 'ar' | 'en'
  const [mode, setMode] = useState('quiz'); // quiz | speak
  const [sWord, setSWord] = useState(null);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const micOK = isListeningSupported();
  const [q, setQ] = useState(null);
  const [picked, setPicked] = useState(null);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [stars, setStars] = useState(0);
  const [done, setDone] = useState(false);

  const next = useCallback(() => {
    if (!pool.length) return;
    const target = getRandomItem(pool);
    const age = ageMinOf(profile?.ageGroupId);
    const options = buildWordOptions(pool, target.en, {
      count: choicesForAge(age, pool.length - 1),
      lang,
    }).map((o) => ({
      ...o,
      text: lang === 'ar' ? wordDisplay(pool.find((p) => p.en === o.key) || { ar: o.text, en: o.key }, age, 'ar') : o.text,
    }));
    setQ({ target, options });
    setPicked(null);
  }, [pool, lang, profile]);

  useEffect(() => {
    if (pool.length) next();
    return () => { stopSpeech(); stopVoice(); stopAllAudio(); };
  }, [next, pool.length, lang]);

  // Teacher greets once when the game starts.
  const greeted = useRef(false);
  useEffect(() => {
    if (!greeted.current) {
      greeted.current = true;
      playSeq([keys.greet()]);
    }
  }, []);

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
    setIndex(0); setCorrectCount(0); setStars(0); setDone(false); next();
  };

  const wordKeys = (target) => {
    const idx = Math.max(0, pool.findIndex((p) => p.en === target.en));
    return vocabKeys(topic, idx, target.ar, target.en);
  };

  const onPick = async (opt) => {
    if (picked !== null) return;
    setPicked(opt.key);
    const isCorrect = opt.key === q.target.en;
    if (isCorrect) {
      hapticSuccess();
      // Praise FIRST in arabic alone, THEN the word in arabic alone,
      // THEN in english alone — never overlapping, like a real teacher.
      await playSeq([keys.praise(), ...wordKeys(q.target)]);
      setCorrectCount((c) => c + 1);
      setStars((s) => s + 1);
      await storage.addStars(`vocab-${topic}`, 1);
    } else {
      hapticError();
      await playSeq([keys.encourage()]);
      await storage.addStars(`vocab-${topic}`, 0);
    }
    if (index + 1 >= ROUND) {
      setDone(true);
      storage.bumpSession();
    } else {
      setIndex((i) => i + 1);
      next();
    }
  };

  const learnWord = () => {
    if (!q) return;
    tap();
    // Arabic alone first, english alone after it finishes.
    playSeq(wordKeys(q.target));
  };

  const switchMode = async (m) => {
    tap();
    await stopVoice();
    setMode(m);
    setIndex(0); setCorrectCount(0); setStars(0); setDone(false);
  };

  // ---- Speak-after-me mode: the kid LEARNS to say english words ----
  const newSpeakWord = useCallback(() => {
    if (!pool.length) return;
    setSWord((prev) => {
      let w = getRandomItem(pool);
      let guard = 0;
      while (prev && w.en === prev.en && guard++ < 12) w = getRandomItem(pool);
      return w;
    });
    setHeard('');
  }, [pool]);

  useEffect(() => {
    if (mode === 'speak' && !sWord) newSpeakWord();
  }, [mode, sWord, newSpeakWord]);

  // Teacher models the word when it appears: "say after me" + the word.
  useEffect(() => {
    if (mode !== 'speak' || !sWord) return;
    const idx = Math.max(0, pool.findIndex((p) => p.en === sWord.en));
    playSeq([
      { key: 'repeat_after', fb: { kind: 'ar', text: 'قول ورايا يا بطل' } },
      ...vocabKeys(topic, idx, sWord.ar, sWord.en),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, sWord]);

  const speakOnlyEn = () => {
    if (!sWord) return;
    tap();
    const idx = Math.max(0, pool.findIndex((p) => p.en === sWord.en));
    playSeq(vocabKeys(topic, idx, sWord.ar, sWord.en).slice(1));
  };

  const hearWord = async () => {
    if (!sWord || listening) return;
    tap();
    if (!micOK) return;
    setListening(true);
    setHeard('');
    const r = await listenOnce('en-US', 8000);
    setListening(false);
    if (r.transcript) {
      setHeard(r.transcript);
      if (matchesSpoken(r.transcript, sWord.en)) {
        hapticSuccess();
        setStars((s) => s + 1);
        await storage.addStars(`speak-${topic}`, 1);
        await playSeq([
          { key: 'good_speak', fb: { kind: 'ar', text: 'نطقك جميل يا بطل!' } },
          keys.praise(),
        ]);
        newSpeakWord();
      } else {
        hapticError();
        const idx = Math.max(0, pool.findIndex((p) => p.en === sWord.en));
        await playSeq([
          { key: 'say_loud', fb: { kind: 'ar', text: 'قولها تاني بصوت عالي يا بطل' } },
          ...vocabKeys(topic, idx, sWord.ar, sWord.en).slice(1),
        ]);
      }
    } else {
      tap();
    }
  };

  // Fallback when no microphone: parent listens and confirms.
  const confirmSaid = async () => {
    if (!sWord) return;
    tap();
    hapticSuccess();
    setStars((s) => s + 1);
    await storage.addStars(`speak-${topic}`, 1);
    await playSeq([keys.praise()]);
    newSpeakWord();
  };

  const switchLang = (l) => {
    tap();
    setLang(l);
    setIndex(0); setCorrectCount(0); setStars(0);
  };

  if (done) {
    return (
      <ScreenShell>
        <View style={styles.result}>
          <Image source={IMAGES.win} style={{ width: 220, height: 220 }} contentFit="contain" />
          <Text style={styles.resultH}>شغل عظيم!</Text>
          <Text style={styles.resultSub}>جبت {correctCount} إجابة صح من {ROUND}</Text>
          <Text style={styles.resultStars}>⭐ {stars} نجمة</Text>
          <BigButton emoji="🔁" title="العب تاني" color={meta.color} onPress={replay} />
          <BigButton
            emoji="✅"
            title="رجوع للقائمة"
            color={colors.green}
            onPress={() => navigation.navigate('VocabMenu', { profile })}
          />
        </View>
      </ScreenShell>
    );
  }

  if (!q) return null;

  return (
    <ScreenShell>
      <View style={styles.topBar}>
        <BackButton to="VocabMenu" navigation={navigation} routeParams={{ profile }} />
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

      <View style={styles.langRow}>
        <Pressable
          onPress={() => switchMode('quiz')}
          style={[styles.langBtn, mode === 'quiz' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
        >
          <Text style={[styles.langTxt, mode === 'quiz' && { color: colors.textLight }]}>اختبرني ✏️</Text>
        </Pressable>
        <Pressable
          onPress={() => switchMode('speak')}
          style={[styles.langBtn, mode === 'speak' && { backgroundColor: colors.secondary, borderColor: colors.secondary }]}
        >
          <Text style={[styles.langTxt, mode === 'speak' && { color: colors.text }]}>قول ورايا 🗣️</Text>
        </Pressable>
      </View>

      {mode === 'speak' ? (
        sWord && (
          <View style={styles.card}>
            <Text style={styles.bigEmoji}>{sWord.emoji}</Text>
            <Text style={styles.speakAr}>{sWord.ar}</Text>
            <Text style={styles.speakEn}>{sWord.en}</Text>
            <View style={styles.speakRow}>
              <Pressable
                onPress={speakOnlyEn}
                style={({ pressed }) => [styles.learnBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.learnTxt}>🔊 اسمعها</Text>
              </Pressable>
              {micOK ? (
                <Pressable
                  onPress={hearWord}
                  style={({ pressed }) => [
                    styles.micBtn,
                    listening && { backgroundColor: colors.error },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.learnTxt}>{listening ? '🎤 بسمعك...' : '🎤 قولها'}</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={confirmSaid}
                  style={({ pressed }) => [styles.micBtn, pressed && { opacity: 0.8 }]}
                >
                  <Text style={styles.learnTxt}>✅ قولتها بصوت عالي</Text>
                </Pressable>
              )}
            </View>
            {!micOK && (
              <Text style={styles.micHint}>قول الكلمة بصوت عالي وخلي ماما تدوس ✅</Text>
            )}
            {!!heard && (
              <Text style={styles.heardTxt}>سمعتك بتقول: {heard}</Text>
            )}
            <Pressable onPress={() => { tap(); newSpeakWord(); }} style={styles.nextWord}>
              <Text style={styles.nextWordTxt}>كلمة تانية ⏭</Text>
            </Pressable>
          </View>
        )
      ) : (
      <>
      <View style={styles.langRow}>
        <Pressable
          onPress={() => switchLang('ar')}
          android_ripple={{ color: colors.cardBorder }}
          style={[styles.langBtn, lang === 'ar' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
        >
          <Text style={[styles.langTxt, lang === 'ar' && { color: colors.textLight }]}>عربي 🇪🇬</Text>
        </Pressable>
        <Pressable
          onPress={() => switchLang('en')}
          android_ripple={{ color: colors.cardBorder }}
          style={[styles.langBtn, lang === 'en' && { backgroundColor: colors.secondary, borderColor: colors.secondary }]}
        >
          <Text style={[styles.langTxt, lang === 'en' && { color: colors.text }]}>English 🇬🇧</Text>
        </Pressable>
      </View>
      <View style={[styles.badge, { backgroundColor: meta.color }]}>
        <Text style={styles.badgeTxt}>{meta.emoji} {meta.label}</Text>
      </View>

        <View style={styles.card}>
          <Text style={styles.bigEmoji}>{q.target.emoji}</Text>
        <Pressable
          onPress={learnWord}
          android_ripple={{ color: colors.clayEdge }}
          style={({ pressed }) => [styles.learnBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.learnTxt}>🔊 اسمع الكلمة</Text>
        </Pressable>
        <Pressable
          onPress={() => { tap(); navigation.navigate('Teach', { subject: 'words', topic, profile, from: 'play' }); }}
          android_ripple={{ color: colors.clayEdge }}
          style={({ pressed }) => [styles.learnBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.learnTxt}>💡 اشرح تاني</Text>
        </Pressable>
      </View>

      <Text style={styles.prompt}>
        {lang === 'ar' ? 'اختار الكلمة الصح بالعربي' : 'Choose the right word in English'}
      </Text>

      <View style={styles.choices}>
        {q.options.map((opt) => {
          const isCorrect = opt.key === q.target.en;
          const isPicked = opt.key === picked;
          let bg = colors.cardBg;
          let ink = colors.text;
          if (picked !== null && isCorrect) { bg = colors.success; ink = colors.textLight; }
          else if (isPicked && !isCorrect) { bg = colors.error; ink = colors.textLight; }
          return (
            <Pressable
              key={opt.key}
              onPress={() => { tap(); onPick(opt); }}
              android_ripple={{ color: colors.clayEdge }}
              style={({ pressed }) => [
                styles.choice,
                { backgroundColor: bg },
                pressed && picked === null && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <Text style={styles.choiceEmoji}>{opt.emoji}</Text>
              <Text style={[styles.choiceTxt, { color: ink }]}>{opt.text}</Text>
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

  langRow: {
    flexDirection: 'row-reverse', gap: space.sm, justifyContent: 'center',
    marginVertical: space.md,
  },
  langBtn: {
    paddingHorizontal: space.lg, paddingVertical: 10, minHeight: 48, justifyContent: 'center',
    borderRadius: radius.round, borderWidth: clay.border, borderColor: colors.cardBorder,
    borderBottomWidth: clay.edge, borderBottomColor: colors.clayEdge,
    backgroundColor: colors.cardBg,
  },
  langTxt: { fontFamily: fam.round, color: colors.text, fontSize: font.xs },

  badge: {
    alignSelf: 'center', paddingHorizontal: space.md, paddingVertical: 6,
    borderRadius: radius.round, marginBottom: space.md,
    borderBottomWidth: 3, borderBottomColor: colors.clayEdge,
  },
  badgeTxt: { color: colors.textLight, fontFamily: fam.round, fontSize: font.xs },

  card: {
    backgroundColor: colors.cardBg, borderWidth: clay.border, borderColor: colors.cardBorder,
    borderBottomWidth: clay.edge, borderBottomColor: colors.clayEdge,
    borderRadius: radius.xl, padding: space.xl, alignItems: 'center',
    shadowColor: '#0F172A', shadowOpacity: 0.1, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },
  emoji: { fontSize: 140 },
  bigEmoji: { fontSize: 110, textAlign: 'center' },
  learnBtn: {
    marginTop: space.md, backgroundColor: colors.accent,
    paddingHorizontal: space.md, paddingVertical: 10, borderRadius: radius.round,
    borderBottomWidth: 4, borderBottomColor: colors.clayEdge,
    minHeight: 48, justifyContent: 'center',
  },
  learnTxt: { fontFamily: fam.round, color: colors.textLight, fontSize: font.xs },

  prompt: {
    fontSize: font.md, fontFamily: fam.round, color: colors.text,
    textAlign: 'center', marginVertical: space.md,
  },

  choices: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
  choice: {
    width: '48%', paddingVertical: space.md, paddingHorizontal: space.sm, marginBottom: space.md,
    borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    borderWidth: clay.border, borderColor: colors.cardBorder,
    borderBottomWidth: clay.edge, borderBottomColor: colors.clayEdge,
    minHeight: 110, gap: 4,
  },
  choiceEmoji: { fontSize: 44 },
  choiceTxt: { fontSize: font.sm, fontFamily: fam.round, textAlign: 'center' },
  speakAr: { fontSize: font.lg, fontFamily: fam.round, color: colors.text, textAlign: 'center', marginTop: space.sm },
  speakEn: { fontSize: font.md, fontFamily: fam.roundBold, color: colors.primary, textAlign: 'center', marginTop: 2 },
  speakRow: { flexDirection: 'row-reverse', gap: space.sm, marginTop: space.md, justifyContent: 'center' },
  micBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: space.md, paddingVertical: 10, borderRadius: radius.round,
    borderBottomWidth: 4, borderBottomColor: colors.clayEdge,
    minHeight: 48, justifyContent: 'center',
  },
  micHint: { fontSize: font.xs, fontFamily: fam.roundMedium, color: colors.muted, textAlign: 'center', marginTop: space.sm },
  heardTxt: { fontSize: font.xs, fontFamily: fam.roundBold, color: colors.primary, textAlign: 'center', marginTop: space.sm },
  nextWord: { marginTop: space.md, padding: space.sm, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  nextWordTxt: { fontSize: font.xs, fontFamily: fam.roundBold, color: colors.muted },

  result: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resultH: { fontSize: font.xl, fontFamily: fam.round, color: colors.text, marginTop: space.md },
  resultSub: { fontSize: font.md, fontFamily: fam.roundMedium, color: colors.text, marginTop: space.sm },
  resultStars: {
    fontSize: font.lg, fontFamily: fam.round, color: colors.orange, marginTop: space.md,
    marginBottom: space.md,
  },
});
