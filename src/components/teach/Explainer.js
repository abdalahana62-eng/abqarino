// Explainer: generic scene player. Renders one step at a time, auto-advances
// when the step finishes (audio included), with big controls:
// [إعادة] replay step · [التالي ⏭] big skip-ahead · [تخطي الشرح] finish.
// First visit: auto-starts on mount. Uses theme values only.
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font, fam, space, radius } from '../../theme';
import { stopAllAudio } from '../../logic/teachAudio.js';
import { SayStep, ShowObjectsStep, CountStep, ShowNumeralStep, PauseStep, WordCardStep } from './stepsBasic';
import { MoveStep, TakeAwayStep, EquationStep, NumberLineStep } from './stepsOps';
import { BlocksStep, GroupsStep, FractionStep, AskStep } from './stepsAdv';

const RENDER = {
  say: SayStep,
  showObjects: ShowObjectsStep,
  count: CountStep,
  showNumeral: ShowNumeralStep,
  move: MoveStep,
  takeAway: TakeAwayStep,
  equation: EquationStep,
  numberLine: NumberLineStep,
  blocks: BlocksStep,
  groups: GroupsStep,
  fraction: FractionStep,
  ask: AskStep,
  pause: () => null,
  wordCard: WordCardStep,
};

export function PauseRender({ step, onComplete }) {
  React.useEffect(() => {
    const t = setTimeout(onComplete, step.ms || 700);
    return () => clearTimeout(t);
  }, [step, onComplete]);
  return null;
}
RENDER.pause = PauseRender;

export default function Explainer({ scene, onDone, title, allowSkip = true }) {
  const [idx, setIdx] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const lock = useRef(false);
  const total = scene?.steps?.length ?? 0;
  const step = scene?.steps?.[idx];
  const StepView = (step && RENDER[step.t]) || null;

  const go = (n) => {
    stopAllAudio();
    lock.current = false;
    if (n >= total) {
      onDone?.('finished');
    } else {
      setIdx(n);
      setReplayKey((k) => k + 1);
    }
  };

  const complete = () => {
    if (lock.current) return;
    lock.current = true;
    setTimeout(() => go(idx + 1), 450);
  };

  const replay = () => {
    stopAllAudio();
    lock.current = false;
    setReplayKey((k) => k + 1);
  };

  if (!step || !StepView) {
    return (
      <View style={styles.box}>
        <Text style={styles.cap}>خلص الشرح! 🎉</Text>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      {!!title && <Text style={styles.title}>{title}</Text>}
      <Text style={styles.progress}>
        {idx + 1} / {total}
      </Text>
      <View style={styles.stage} key={`${idx}-${replayKey}`}>
        <StepView step={step} onComplete={complete} />
      </View>
      <View style={styles.controls}>
        <Pressable onPress={replay} style={[styles.btn, styles.btnGhost]}>
          <Text style={styles.btnGhostTxt}>🔁 إعادة</Text>
        </Pressable>
        <Pressable onPress={() => go(idx + 1)} style={[styles.btn, styles.btnNext]}>
          <Text style={styles.btnNextTxt}>التالي ⏭</Text>
        </Pressable>
      </View>
      {allowSkip && (
        <Pressable onPress={() => { stopAllAudio(); onDone?.('skipped'); }} style={styles.skip}>
          <Text style={styles.skipTxt}>تخطي الشرح</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%' },
  title: { fontSize: font.md, fontFamily: fam.round, color: colors.text, textAlign: 'center', marginBottom: space.sm },
  progress: { fontSize: font.xs, fontFamily: fam.roundBold, color: colors.muted, textAlign: 'center', marginBottom: space.sm },
  stage: { minHeight: 300, justifyContent: 'center' },
  controls: { flexDirection: 'row-reverse', gap: space.sm, marginTop: space.md },
  btn: { flex: 1, minHeight: 64, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  btnNext: { backgroundColor: '#221C46', flex: 2 },
  btnNextTxt: { color: '#fff', fontFamily: fam.round, fontSize: font.md },
  btnGhost: { backgroundColor: colors.cardBg, borderWidth: 3, borderColor: colors.cardBorder },
  btnGhostTxt: { fontFamily: fam.roundBold, fontSize: font.sm, color: colors.text },
  skip: { marginTop: space.sm, padding: space.sm, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  skipTxt: { fontFamily: fam.roundBold, fontSize: font.xs, color: colors.muted },
  cap: { fontSize: font.md, fontFamily: fam.round, color: colors.text, textAlign: 'center' },
});
