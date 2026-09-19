// Operation steps: move / takeAway / equation / numberLine.
// Same theme values as the rest of the app.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, font, fam, space, radius } from '../../theme';
import { speakText, partSpeech } from '../../logic/teachAudio.js';
import { playKey, keys } from '../../utils/voice.js';
import { waitMs } from '../../logic/teachRunner.js';

async function sayPart(part, dead) {
  if (dead()) return;
  const s = partSpeech(part);
  if (!s) return;
  if (s.kind === 'num') {
    await playKey(keys.num(s.value) || '__missing__', { kind: 'ar', text: String(s.value) });
  } else {
    await speakText(s.value, 'ar-EG');
  }
}

export function MoveStep({ step, onComplete }) {
  // { aEmoji, a, bEmoji, b } — group b flies up to join group a.
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let dead = false;
    (async () => {
      if (step.caption) await speakText(step.caption, 'ar-EG');
      if (dead) return;
      Animated.timing(anim, { toValue: 1, duration: 1100, useNativeDriver: true }).start();
      await waitMs(1300);
      if (!dead) onComplete();
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const lift = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -64] });
  return (
    <View>
      {!!step.caption && <Text style={styles.cap}>{step.caption}</Text>}
      <View style={styles.row}>
        {Array.from({ length: step.a || 0 }).map((_, i) => (
          <Text key={`a${i}`} style={styles.obj}>{step.aEmoji}</Text>
        ))}
      </View>
      <Animated.View style={[styles.row, { transform: [{ translateY: lift }] }]}>
        {Array.from({ length: step.b || 0 }).map((_, i) => (
          <Text key={`b${i}`} style={styles.obj}>{step.bEmoji || step.aEmoji}</Text>
        ))}
      </Animated.View>
    </View>
  );
}

export function TakeAwayStep({ step, onComplete }) {
  // { emoji, n, take } — `take` items fly away and fade.
  const n = step.n || 1;
  const take = Math.min(step.take ?? 1, n);
  const anims = useRef(Array.from({ length: n }, () => new Animated.Value(0))).current;
  useEffect(() => {
    let dead = false;
    (async () => {
      if (step.caption) await speakText(step.caption, 'ar-EG');
      if (dead) return;
      const seq = anims.slice(0, take).map((a) =>
        Animated.timing(a, { toValue: 1, duration: 600, useNativeDriver: true })
      );
      Animated.stagger(450, seq).start();
      await waitMs(450 * take + 800);
      if (!dead) onComplete();
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View>
      {!!step.caption && <Text style={styles.cap}>{step.caption}</Text>}
      <View style={styles.row}>
        {Array.from({ length: n }).map((_, i) => {
          const fly = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, -110] });
          const fade = anims[i].interpolate({ inputRange: [0, 1], outputRange: [1, 0.1] });
          return (
            <Animated.View key={i} style={{ transform: [{ translateY: fly }], opacity: i < take ? fade : 1 }}>
              <Text style={styles.obj}>{step.emoji}</Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

export function EquationStep({ step, onComplete }) {
  const [shown, setShown] = useState(0);
  const parts = step.parts || [];
  useEffect(() => {
    let dead = false;
    (async () => {
      await waitMs(400);
      for (let i = 0; i < parts.length; i++) {
        if (dead) return;
        setShown(i + 1);
        await sayPart(parts[i], () => dead);
        await waitMs(300);
      }
      await waitMs(500);
      if (!dead) onComplete();
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View>
      {!!step.caption && <Text style={styles.cap}>{step.caption}</Text>}
      <View style={styles.eqRow}>
        {parts.slice(0, shown).map((p, i) => (
          <Text key={i} style={p.t === 'num' ? styles.eqNum : styles.eqOp}>
            {p.v}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function NumberLineStep({ step, onComplete }) {
  // { from, to, jumps: [landing spots], emoji } — mascot hops landing by landing.
  const { from = 0, to = 10, jumps = [], emoji = '🦊' } = step;
  const [pos, setPos] = useState(from);
  const cells = [];
  for (let i = from; i <= to; i++) cells.push(i);
  useEffect(() => {
    let dead = false;
    (async () => {
      if (step.caption) await speakText(step.caption, 'ar-EG');
      await waitMs(400);
      for (const j of jumps) {
        if (dead) return;
        setPos(j);
        await playKey(keys.num(j) || '__missing__', { kind: 'ar', text: String(j) });
        await waitMs(450);
      }
      await waitMs(400);
      if (!dead) onComplete();
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View>
      {!!step.caption && <Text style={styles.cap}>{step.caption}</Text>}
      <View style={styles.line}>
        {cells.map((c) => (
          <View key={c} style={styles.tick}>
            <Text style={styles.tickNum}>{c}</Text>
            <Text style={styles.mascot}>{c === pos ? emoji : ''}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cap: { fontSize: font.md, fontFamily: fam.round, color: colors.text, textAlign: 'center', marginBottom: space.md },
  row: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', marginBottom: space.sm },
  obj: { fontSize: 52, margin: 4 },
  eqRow: {
    flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.cardBg, borderRadius: radius.lg, padding: space.md, minHeight: 96,
  },
  eqNum: { fontSize: font.xl, fontFamily: fam.round, color: colors.primary, marginHorizontal: 6 },
  eqOp: { fontSize: font.xl, fontFamily: fam.round, color: colors.text, marginHorizontal: 6 },
  line: { flexDirection: 'row-reverse', justifyContent: 'center', backgroundColor: colors.cardBg, borderRadius: radius.lg, padding: space.sm },
  tick: { alignItems: 'center', width: 34 },
  tickNum: { fontSize: font.xs, fontFamily: fam.roundBold, color: colors.muted },
  mascot: { fontSize: 26, minHeight: 32 },
});
