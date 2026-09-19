import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font, fam, space, radius, clay } from '../theme';
import { VOCAB_TOPIC_META, getAgeGroup } from '../data/ageGroups';
import { VOCAB, getRandomItem, shuffle } from '../data/vocab';
import { storage } from '../utils/storage';
import { speakAr, speakEn, hapticSuccess, hapticError, stopSpeech, tap } from '../utils/speech';
import BigButton from '../components/BigButton';
import { Image } from 'expo-image';
import { IMAGES } from '../utils/images';
import BackButton from '../components/BackButton';
import ScreenShell from '../components/ScreenShell';

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

  const replay = () => {
    setIndex(0); setCorrectCount(0); setStars(0); setDone(false); next();
  };

  const onPick = async (opt) => {
    if (picked !== null) return;
    setPicked(opt.key);
    const isCorrect = opt.key === q.target.en;
    if (isCorrect) {
      hapticSuccess();
      speakAr('برافو! إجابة صحيحة');
      setTimeout(() => {
        if (lang === 'ar') speakAr(q.target.ar);
        else speakEn(q.target.en);
      }, 600);
      setCorrectCount((c) => c + 1);
      setStars((s) => s + 1);
      await storage.addStars(`vocab-${topic}`, 1);
    } else {
      hapticError();
      speakAr('حاول مرة أخرى');
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
    }, 1700);
  };

  const learnWord = () => {
    if (!q) return;
    tap();
    speakAr(q.target.ar);
    setTimeout(() => speakEn(q.target.en), 1000);
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
          <Mascot emoji={q.target.emoji} size={110} colors={['#FFFFFF', colors.bgAlt]} style={{ borderColor: meta.color }} />
        <Pressable
          onPress={learnWord}
          android_ripple={{ color: colors.clayEdge }}
          style={({ pressed }) => [styles.learnBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.learnTxt}>🔊 اسمع الكلمة</Text>
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
              <Text style={[styles.choiceTxt, { color: ink }]}>{opt.text}</Text>
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
    width: '48%', paddingVertical: space.lg, marginBottom: space.md,
    borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    borderWidth: clay.border, borderColor: colors.cardBorder,
    borderBottomWidth: clay.edge, borderBottomColor: colors.clayEdge,
    minHeight: 88,
  },
  choiceTxt: { fontSize: font.md, fontFamily: fam.round },

  result: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resultH: { fontSize: font.xl, fontFamily: fam.round, color: colors.text, marginTop: space.md },
  resultSub: { fontSize: font.md, fontFamily: fam.roundMedium, color: colors.text, marginTop: space.sm },
  resultStars: {
    fontSize: font.lg, fontFamily: fam.round, color: colors.orange, marginTop: space.md,
    marginBottom: space.md,
  },
});
