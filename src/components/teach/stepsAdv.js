// Advanced steps: blocks / groups / fraction / ask.
// Same theme values as the rest of the app. `ask` reuses BigButton.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, fam, space, radius } from '../../theme';
import { speakText } from '../../logic/teachAudio.js';
import { playKey } from '../../utils/voice.js';
import { waitMs } from '../../logic/teachRunner.js';
import { tap, hapticSuccess } from '../../utils/speech.js';
import BigButton from '../BigButton';

export function BlocksStep({ step, onComplete }) {
  // { tens, ones } or { convert: 'toRod'|'toUnits' } with { tens, ones }.
  const [phase, setPhase] = useState(0);
  const tens = step.tens ?? 0;
  const ones = step.ones ?? 0;
  const convert = step.convert;
  useEffect(() => {
    let dead = false;
    (async () => {
      if (step.caption) await speakText(step.caption, 'ar-EG');
      if (dead) return;
      if (convert) {
        await waitMs(600);
        if (!dead) setPhase(1);
        await speakText(step.convertSay || 'شوف اللي هيحصل', 'ar-EG');
        await waitMs(600);
      }
      if (!dead) onComplete();
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const showTens = convert === 'toRod' ? tens + (phase ? 1 : 0) : tens;
  const showOnes = convert === 'toRod' ? (phase ? ones - 10 : ones) : convert === 'toUnits' ? (phase ? ones + 10 : ones) : ones;
  const showTensU = convert === 'toUnits' ? tens - (phase ? 1 : 0) : showTens;
  return (
    <View>
      {!!step.caption && <Text style={styles.cap}>{step.caption}</Text>}
      <View style={styles.row}>
        {Array.from({ length: Math.max(0, showTensU) }).map((_, i) => (
          <View key={`t${i}`} style={styles.rod} />
        ))}
      </View>
      <View style={styles.row}>
        {Array.from({ length: Math.max(0, showOnes) }).map((_, i) => (
          <View key={`o${i}`} style={styles.cube} />
        ))}
      </View>
      {!!convert && phase === 0 && <Text style={styles.hint}>بص كويس... 👀</Text>}
    </View>
  );
}

export function GroupsStep({ step, onComplete }) {
  // rows mode: { mode:'rows', rows, cols, emoji } — rows appear one by one.
  // share mode: { mode:'share', items, kids, emoji } — items land under kids round by round.
  const [shown, setShown] = useState(0);
  const total = step.mode === 'share' ? step.items : (step.rows || 1) * (step.cols || 1);
  useEffect(() => {
    let dead = false;
    (async () => {
      if (step.caption) await speakText(step.caption, 'ar-EG');
      const rounds = step.mode === 'share' ? step.kids : step.rows || 1;
      for (let r = 0; r < rounds; r++) {
        if (dead) return;
        setShown(r + 1);
        await waitMs(900);
      }
      if (!dead) {
        if (step.finalSay) await speakText(step.finalSay, 'ar-EG');
        onComplete();
      }
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (step.mode === 'share') {
    const perKid = Math.floor((step.items || 0) / Math.max(1, step.kids || 1));
    return (
      <View>
        {!!step.caption && <Text style={styles.cap}>{step.caption}</Text>}
        <View style={styles.row}>
          {Array.from({ length: step.kids || 1 }).map((_, k) => (
            <View key={k} style={styles.kid}>
              <Text style={styles.kidFace}>🧒</Text>
              <View style={styles.row}>
                {Array.from({ length: k < shown ? perKid : 0 }).map((_, i) => (
                  <Text key={i} style={styles.small}>{step.emoji}</Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }
  return (
    <View>
      {!!step.caption && <Text style={styles.cap}>{step.caption}</Text>}
      {Array.from({ length: step.rows || 1 }).map((_, r) => (
        <View key={r} style={styles.row}>
          {r < shown
            ? Array.from({ length: step.cols || 1 }).map((_, c) => (
                <Text key={c} style={styles.obj}>{step.emoji}</Text>
              ))
            : <Text style={styles.objDim}>·</Text>}
        </View>
      ))}
    </View>
  );
}

export function FractionStep({ step, onComplete }) {
  // { den, num, shape:'bar' } — segments colorize one by one with counting.
  const [lit, setLit] = useState(0);
  useEffect(() => {
    let dead = false;
    (async () => {
      if (step.caption) await speakText(step.caption, 'ar-EG');
      await waitMs(400);
      for (let i = 0; i < (step.num || 0); i++) {
        if (dead) return;
        setLit(i + 1);
        await playKey(keys.num(i + 1) || '__missing__', { kind: 'ar', text: String(i + 1) });
        await waitMs(350);
      }
      if (!dead && step.namesSay) await speakText(step.namesSay, 'ar-EG');
      await waitMs(400);
      if (!dead) onComplete();
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View>
      {!!step.caption && <Text style={styles.cap}>{step.caption}</Text>}
      <View style={styles.fracBar}>
        {Array.from({ length: step.den || 2 }).map((_, i) => (
          <View key={i} style={[styles.fracCell, i < lit && styles.fracLit]} />
        ))}
      </View>
      {!!step.namesSay && <Text style={styles.hint}>{step.namesSay}</Text>}
    </View>
  );
}

export function AskStep({ step, onComplete }) {
  // { prompt, options: [{label, emoji}], answer, hint } — press interaction.
  // Auto hint after 3s; after 2nd wrong the answer glows and we move on.
  const [wrong, setWrong] = useState(0);
  const [picked, setPicked] = useState(null);
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    let dead = false;
    (async () => {
      await speakText(step.prompt, 'ar-EG');
      if (dead) return;
      await waitMs(3000);
      if (!dead) setShowHint(true);
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pick = async (label) => {
    tap();
    if (label === step.answer) {
      hapticSuccess();
      setPicked(label);
      await playKey('praise1', { kind: 'ar', text: 'برافو عليك يا بطل!' });
      onComplete();
    } else {
      const w = wrong + 1;
      setWrong(w);
      setPicked(label);
      setShowHint(true);
      // Guided: the correct answer glows right after the first wrong try.
      await waitMs(900);
      onComplete();
    }
  };
  return (
    <View>
      <Text style={styles.cap}>{step.prompt}</Text>
      {step.options.map((o) => {
        const isAns = o.label === step.answer;
        const glow = (wrong >= 1 && isAns) || picked === o.label;
        return (
          <BigButton
            key={o.label}
            emoji={o.emoji}
            title={o.label}
            color={glow ? colors.success : colors.primary}
            onPress={() => pick(o.label)}
          />
        );
      })}
      {showHint && !!step.hint && <Text style={styles.hint}>💡 {step.hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  cap: { fontSize: font.md, fontFamily: fam.round, color: colors.text, textAlign: 'center', marginBottom: space.md },
  hint: { fontSize: font.xs, fontFamily: fam.roundMedium, color: colors.muted, textAlign: 'center', marginTop: space.sm },
  row: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', marginBottom: space.sm },
  obj: { fontSize: 52, margin: 4 },
  objDim: { fontSize: 40, margin: 4, color: colors.cardBorder },
  small: { fontSize: 30, margin: 2 },
  rod: { width: 26, height: 120, borderRadius: 10, backgroundColor: colors.primary, margin: 5 },
  cube: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.secondary, margin: 4 },
  kid: { alignItems: 'center', margin: 6, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: radius.md, padding: 6, minWidth: 90 },
  kidFace: { fontSize: 44 },
  fracBar: { flexDirection: 'row', height: 72, borderRadius: radius.md, overflow: 'hidden', borderWidth: 3, borderColor: colors.cardBorder },
  fracCell: { flex: 1, backgroundColor: '#EDEDED', borderRightWidth: 1, borderRightColor: colors.cardBorder },
  fracLit: { backgroundColor: colors.accent },
});
