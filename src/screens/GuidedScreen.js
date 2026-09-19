import React, { useMemo } from 'react';
import { getAgeGroup } from '../data/ageGroups';
import { generateMathQuestion } from '../data/math';
import { VOCAB } from '../data/vocab';
import AppHeader from '../components/AppHeader';
import ScreenShell from '../components/ScreenShell';
import Explainer from '../components/teach/Explainer';
import { IMAGES } from '../utils/images';

// Guided: 2-3 questions with full help right after teaching, no stars.
// Math reuses the generators; words reuse the pool. Then → Play (practice).
export default function GuidedScreen({ route, navigation }) {
  const { subject, topic, profile } = route.params || {};
  const group = getAgeGroup(profile?.ageGroupId);
  const isWords = subject === 'words';

  const scene = useMemo(() => {
    const steps = [];
    if (isWords) {
      const pool = VOCAB[topic] || [];
      const picks = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
      for (const w of picks) {
        const others = pool.filter((p) => p.en !== w.en).slice(0, 2);
        steps.push({
          t: 'ask',
          prompt: `دوس على ${w.ar}`,
          options: [
            { label: w.ar, emoji: w.emoji },
            ...others.map((o) => ({ label: o.ar, emoji: o.emoji })),
          ].sort(() => 0.5 - Math.random()),
          answer: w.ar,
          hint: `اسمع الكلمة: ${w.en}`,
        });
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const q = generateMathQuestion(topic, { ...group, ageGroupId: profile?.ageGroupId });
        steps.push({
          t: 'ask',
          prompt: q.question,
          options: q.choices.map((c) => ({ label: String(c), emoji: '👆' })),
          answer: String(q.answer),
          hint: q.speak || q.question,
        });
      }
    }
    return { id: `guided_${subject}_${topic}`, steps };
  }, [isWords, topic, profile, group]);

  const goPlay = () => {
    navigation.replace(isWords ? 'VocabPlay' : 'MathPlay', { profile, topic });
  };

  return (
    <ScreenShell
      header={
        <AppHeader
          title="🤝 جرّب معايا"
          subtitle="نحل مع بعض، مفيش نجوم هنا"
          mascot="🤝"
          mascotImage={IMAGES.mascotOwl}
          showBack
          backTo={isWords ? 'VocabMenu' : 'MathMenu'}
          backParams={{ profile }}
          navigation={navigation}
        />
      }
    >
      <Explainer
        key={`${subject}-${topic}`}
        scene={scene}
        title="حل معايا خطوة بخطوة"
        allowSkip
        onDone={goPlay}
      />
    </ScreenShell>
  );
}
