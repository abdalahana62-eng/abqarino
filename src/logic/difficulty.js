// Pure learning-logic: age mapping, rounds, choice counts, adaptive difficulty,
// lesson completion and stars. No imports, no side effects — fully testable.

export const GROUP_MIN_AGE = { '3-4': 3, '5-6': 5, '7-8': 7, '9-10': 9 };

export function ageMinOf(ageGroupId) {
  return GROUP_MIN_AGE[ageGroupId] ?? 4;
}

// Round length: 6 questions for ages 3-5, 8 for ages 6-10.
export function roundsForAge(age) {
  return age <= 5 ? 6 : 8;
}

// Choice counts: 3-4 → 2, 5-6 → 3, 7-8 → 3 أو 4 (نختار 4 عند توفر مشتتات كافية), 9-10 → 4.
export function choicesForAge(age, availableDistractors = 99) {
  let n;
  if (age <= 4) n = 2;
  else if (age <= 6) n = 3;
  else n = 4;
  return Math.max(2, Math.min(n, 1 + availableDistractors));
}

// Adaptive difficulty state: { level: 0, wrongStreak, correctStreak }.
// - 3 wrong in a row → step down (min -2), suggest an easy question.
// - 5 fast-correct in a row → step up (max +2) within the age band.
export function adapt(state, { correct, fast = false }) {
  const s = {
    level: state?.level ?? 0,
    wrongStreak: state?.wrongStreak ?? 0,
    correctStreak: state?.correctStreak ?? 0,
  };
  let easyNext = false;
  if (correct) {
    s.wrongStreak = 0;
    s.correctStreak += 1;
    if (s.correctStreak >= 5 && fast && s.level < 2) {
      s.level += 1;
      s.correctStreak = 0;
    }
  } else {
    s.correctStreak = 0;
    s.wrongStreak += 1;
    if (s.wrongStreak >= 3) {
      if (s.level > -2) s.level -= 1;
      s.wrongStreak = 0;
      easyNext = true;
    }
  }
  return { ...s, easyNext };
}

// Apply level offset to numeric bounds (smaller numbers when stepped down).
export function shiftBounds(min, max, level) {
  if (!level) return { min, max };
  const span = Math.max(1, max - min);
  const shrink = Math.min(span - 1, Math.abs(level) * Math.ceil(span / 3));
  if (level < 0) return { min, max: max - shrink };
  return { min: min + Math.min(shrink, span - 1), max };
}

// Lesson completion: 80% correct (8/10 or equivalent in shorter lessons).
export function lessonComplete(correct, total) {
  if (!total) return false;
  return correct / total >= 0.8;
}

// Stars 1..3 by ratio: 60% / 80% / 95%.
export function starsFor(correct, total) {
  if (!total) return 0;
  const r = correct / total;
  if (r >= 0.95) return 3;
  if (r >= 0.8) return 2;
  if (r >= 0.6) return 1;
  return 0;
}
