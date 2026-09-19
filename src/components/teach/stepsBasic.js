// Basic teaching steps: say / showObjects / count / showNumeral / pause.
// Visual language reused from the app theme (no new colors/fonts).
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, fam, space, radius } from '../../theme';
import { speakText } from '../../logic/teachAudio.js';
import { playKey, keys } from '../../utils/voice.js';
import { waitMs } from '../../logic/teachRunner.js';
import WaveCard from '../WaveCard';

export function SayStep({ step, onComplete }) {
  useEffect(() => {
    let dead = false;
    (async () => {
      await speakText(step.ar, 'ar-EG');
      if (!dead && step.en) await speakText(step.en, 'en-US');
      if (!dead) onComplete();
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <WaveCard bg={colors.purpleSoft}>
      <Text style={styles.sayAr}>{step.ar}</Text>
      {!!step.en && <Text style={styles.sayEn}>{step.en}</Text>}
    </WaveCard>
  );
}

export function ShowObjectsStep({ step, onComplete }) {
  const groups = step.groups || [{ emoji: step.emoji || '⭐', n: step.n || 1 }];
  const total = groups.reduce((s, g) => s + (g.n || 0), 0);
  useEffect(() => {
    let dead = false;
    (async () => {
      if (step.caption || step.ar) await speakText(step.caption || step.ar, 'ar-EG');
      else await waitMs(600 + total * 250);
      if (!dead) onComplete();
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View>
      {!!(step.caption || step.ar) && <Text style={styles.cap}>{step.caption || step.ar}</Text>}
      {groups.map((g, gi) => (
        <View key={gi} style={styles.row}>
          {Array.from({ length: g.n }).map((_, i) => (
            <Text key={i} style={styles.obj}>{g.emoji}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export function CountStep({ step, onComplete }) {
  const n = step.n || 1;
  const emoji = step.emoji || '⭐';
  const [hl, setHl] = useState(-1);
  useEffect(() => {
    let dead = false;
    (async () => {
      await waitMs(400);
      for (let i = 0; i < n; i++) {
        if (dead) return;
        setHl(i);
        await playKey(keys.num(i + 1) || '__missing__', { kind: 'ar', text: String(i + 1) });
        await waitMs(250);
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
      <View style={styles.row}>
        {Array.from({ length: n }).map((_, i) => (
          <View key={i} style={[styles.cell, i === hl && styles.cellHl]}>
            <Text style={styles.obj}>{emoji}</Text>
            <Text style={styles.cellNum}>{i <= hl ? i + 1 : ''}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.bigCount}>{hl >= 0 ? hl + 1 : ''}</Text>
    </View>
  );
}

export function ShowNumeralStep({ step, onComplete }) {
  useEffect(() => {
    let dead = false;
    (async () => {
      await speakText(`هذا الرقم ${step.arName || step.text}`, 'ar-EG');
      if (!dead && step.enName) await speakText(step.enName, 'en-US');
      if (!dead) onComplete();
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <WaveCard bg={colors.yellowSoft}>
      <View style={styles.numRow}>
        <Text style={styles.giant}>{step.text}</Text>
        {!!step.latin && <Text style={styles.giantLatin}>{step.latin}</Text>}
      </View>
      {!!step.arName && <Text style={styles.numName}>{step.arName}</Text>}
      {!!step.enName && <Text style={styles.numNameEn}>{step.enName}</Text>}
    </WaveCard>
  );
}

export function PauseStep({ step, onComplete }) {
  useEffect(() => {
    let dead = false;
    (async () => {
      await waitMs(step.ms || 700);
      if (!dead) onComplete();
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

const styles = StyleSheet.create({
  sayAr: { fontSize: font.lg, fontFamily: fam.round, color: colors.text, textAlign: 'center', lineHeight: 46 },
  sayEn: { fontSize: font.md, fontFamily: fam.roundBold, color: colors.muted, textAlign: 'center', marginTop: space.sm },
  cap: { fontSize: font.md, fontFamily: fam.round, color: colors.text, textAlign: 'center', marginBottom: space.md },
  row: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', marginBottom: space.sm },
  obj: { fontSize: 52, margin: 4 },
  cell: { alignItems: 'center', margin: 4, padding: 6, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.6)', minWidth: 64 },
  cellHl: { backgroundColor: colors.yellowSoft, borderWidth: 3, borderColor: colors.secondary },
  cellNum: { fontSize: font.md, fontFamily: fam.round, color: colors.text, minHeight: 30 },
  bigCount: { fontSize: font.xxl, fontFamily: fam.round, color: colors.text, textAlign: 'center', minHeight: 70 },
  numRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.lg },
  giant: { fontSize: font.giant, fontFamily: fam.round, color: colors.text, textAlign: 'center' },
  giantLatin: { fontSize: font.xxl, fontFamily: fam.round, color: colors.muted },
  numName: { fontSize: font.lg, fontFamily: fam.round, color: colors.text, textAlign: 'center', marginTop: space.sm },
  numNameEn: { fontSize: font.md, fontFamily: fam.roundBold, color: colors.muted, textAlign: 'center' },
});
