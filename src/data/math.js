import { shuffle as shuffleBase } from './vocab.js';

// Fisher-Yates with injectable RNG so seeded runs are fully stable.
function shuffleR(arr, R) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = R(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const shuffle = shuffleBase;

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Deterministic RNG (mulberry32) so the first lessons of a unit are stable.
// generateMathQuestion accepts opts.rng = createRng(seed).
export function createRng(seed) {
  let t = (seed >>> 0) || 1;
  return (min, max) => {
    t += 0x6d2b79f5;
    let z = Math.imul(t ^ (t >>> 15), t | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    const r = ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    return Math.floor(r * (max - min + 1)) + min;
  };
}

const COUNT_EMOJIS = ['🐰', '🍎', '⭐', '🐱', '🐶', '🌻', '🎈', '🍭', '🐟', '🦋'];

function swapDigits(n) {
  const s = String(Math.abs(n));
  if (s.length < 2) return null;
  const t = s[1] + s[0] + s.slice(2);
  const v = parseInt(t, 10);
  return v === n ? null : v;
}

// Plausible wrong choices: close to the answer (±1/±2 for young learners),
// common mistakes for older ones (forgotten carry ±10, digit swap).
// Unique, never equal to the answer, never negative for age < 9.
function numberChoices(answer, min, max, opts = {}) {
  const age = opts.age ?? 6;
  const count = opts.count ?? 4;
  const R = opts.rng || rnd;
  const pool = [];
  const push = (v) => {
    if (!Number.isInteger(v)) return;
    if (v === answer) return;
    if (age < 9 && v < 0) return;
    if (v < min - 20 || v > max + 30) return;
    if (!pool.includes(v)) pool.push(v);
  };
  push(answer + 1); push(answer - 1);
  push(answer + 2); push(answer - 2);
  if (age >= 7) {
    push(answer + 10); push(answer - 10);
    const sw = swapDigits(answer);
    if (sw !== null) push(sw);
    push(answer + 3); push(answer - 3);
  }
  const rndFn = R;
  let guard = 0;
  while (pool.length < count - 1 && guard++ < 300) {
    const spread = Math.max(1, Math.floor(Math.abs(answer) * 0.3) + 2);
    const lo = Math.max(age < 9 ? 0 : min - 20, answer - spread);
    const v = rndFn(lo, Math.min(max + 30, answer + spread));
    push(v);
  }
  const picked = shuffleR(pool, R).slice(0, Math.max(0, count - 1));
  return shuffleR([...picked, answer], R);
}

function fractionChoices(answer, R) {
  const options = ['1/2', '1/3', '1/4', '2/3', '3/4', '2/4', '1/5', '2/5'];
  const set = new Set([answer]);
  for (const o of shuffleR(options, R || rnd)) {
    if (set.size >= 4) break;
    set.add(o);
  }
  return shuffleR([...set], R || rnd);
}

const SHAPES = [
  { name: 'الدايرة', emoji: '⭕' },
  { name: 'المربع', emoji: '🟥' },
  { name: 'المثلث', emoji: '🔺' },
  { name: 'النجمة', emoji: '⭐' },
];

const PATTERNS = [
  { seq: ['🔴', '🟡'], next: '🔴', label: 'أحمر' },
  { seq: ['🔵', '🔵', '🟢'], next: '🔵', label: 'أزرق' },
  { seq: ['⭐', '🌙'], next: '⭐', label: 'نجمة' },
  { seq: ['🍎', '🍎', '🍌'], next: '🍎', label: 'تفاحة' },
];

function pickN(arr, n, rndFn) {
  const a = shuffleR(arr, rndFn || rnd).slice();
  const out = [];
  while (out.length < n && a.length) {
    out.push(a.splice(Math.floor((rndFn || rnd)(0, a.length - 1)), 1)[0]);
  }
  return out;
}

// ageGroup: { maxNum } + optional ageGroupId for age-based choice counts.
// opts: { rng, unit: { params } } — unit params narrow the ranges.
export function generateMathQuestion(topic, ageGroup, opts = {}) {
  const max = ageGroup?.maxNum ?? 20;
  const age = { '3-4': 3, '5-6': 5, '7-8': 7, '9-10': 9 }[ageGroup?.ageGroupId] ?? 6;
  const R = opts.rng || rnd;
  const U = opts.unit?.params || {};
  const choiceCount = opts.count ?? (age <= 4 ? 2 : age <= 6 ? 3 : 4);
  const nc = (ans, lo, hi) => numberChoices(ans, lo, hi, { age, count: choiceCount, rng: R });

  switch (topic) {
    case 'counting': {
      const hi = Math.min(max, U.maxCount ?? 12);
      const lo = Math.max(1, U.minCount ?? 3);
      const n = R(lo, Math.max(lo, hi));
      const emoji = COUNT_EMOJIS[R(0, COUNT_EMOJIS.length - 1)];
      return {
        topic,
        question: 'كام واحد في الصورة؟',
        speak: 'عدّ معايا، كام واحد؟',
        answer: n,
        choices: nc(n, 1, Math.min(max, 20)),
        visual: { type: 'emojis', emoji, count: n },
        parts: { n, ans: n },
      };
    }

    case 'addition': {
      const limit = Math.min(max, U.max ?? 50);
      let a, b;
      if (U.b !== undefined) {
        b = U.b;
        a = R(1, Math.max(1, Math.floor(limit / 2)));
      } else {
        a = R(1, Math.floor(limit / 2));
        b = R(1, Math.floor(limit / 2));
      }
      if (U.noCarry) {
        // keep ones digits summing to <= 9 (no carry into tens)
        let guard = 0;
        while ((a % 10) + (b % 10) > 9 && guard++ < 50) {
          a = R(1, Math.floor(limit / 2));
          b = R(1, Math.floor(limit / 2));
        }
      }
      const ans = a + b;
      return {
        topic,
        question: `${a} + ${b} = ؟`,
        speak: `${a} زائد ${b} يساوي كام؟`,
        answer: ans,
        choices: nc(ans, 1, limit + 10),
        visual: null,
        parts: { a, b, ans },
      };
    }

    case 'subtraction': {
      const limit = Math.min(max, U.max ?? 50);
      const a = R(3, limit);
      const b = R(1, a - 1);
      if (U.noBorrow) {
        // ones digit of a >= ones digit of b (no borrowing)
        let guard = 0, bb = b;
        while ((a % 10) < (bb % 10) && guard++ < 50) bb = R(1, a - 1);
        const ans = a - bb;
        return {
          topic,
          question: `${a} − ${bb} = ؟`,
          speak: `${a} ناقص ${bb} يساوي كام؟`,
          answer: ans,
          choices: nc(ans, 0, limit),
          visual: null,
          parts: { a, b: bb, ans },
        };
      }
      const ans = a - b;
      return {
        topic,
        question: `${a} − ${b} = ؟`,
        speak: `${a} ناقص ${b} يساوي كام؟`,
        answer: ans,
        choices: nc(ans, 0, limit),
        visual: null,
        parts: { a, b, ans },
      };
    }

    case 'multiplication': {
      const tables = U.tables;
      const tMax = U.maxTable ?? 10;
      let a, b;
      if (tables) {
        a = tables[R(0, tables.length - 1)];
        b = R(2, tMax);
      } else if (U.twoDigit) {
        a = R(11, 19);
        b = R(3, 9);
      } else {
        a = R(2, tMax);
        b = R(2, tMax);
      }
      const ans = a * b;
      return {
        topic,
        question: `${a} × ${b} = ؟`,
        speak: `${a} في ${b} يساوي كام؟`,
        answer: ans,
        choices: nc(ans, 1, ans + 20),
        visual: null,
        parts: { a, b, ans },
      };
    }

    case 'division': {
      const tMax = U.maxTable ?? 10;
      const b = R(2, tMax);
      const ans = R(2, tMax);
      const a = b * ans;
      return {
        topic,
        question: `${a} ÷ ${b} = ؟`,
        speak: `${a} على ${b} يساوي كام؟`,
        answer: ans,
        choices: nc(ans, 1, 15),
        visual: null,
        parts: { a, b, ans },
      };
    }

    case 'fractions': {
      const denominator = R(2, 4) === 2 ? 2 : R(3, 4);
      const numerator = R(1, denominator - 1);
      const answer = `${numerator}/${denominator}`;
      return {
        topic,
        question: 'إيه الكسر اللي في الشكل؟',
        speak: 'إيه الكسر اللي في الشكل؟',
        answer,
        choices: fractionChoices(answer, R),
        visual: { type: 'fraction', numerator, denominator },
        parts: { num: numerator, den: denominator, ans: answer },
      };
    }

    case 'compare': {
      const lo = U.min ?? 1;
      const hi = U.max ?? Math.min(max, 10);
      let a = R(lo, hi);
      let b = R(lo, hi);
      let guard = 0;
      while (b === a && guard++ < 20) b = R(lo, hi);
      const mode = U.mode ?? (R(0, 1) === 0 ? 'max' : 'min');
      const ans = mode === 'max' ? Math.max(a, b) : Math.min(a, b);
      const word = mode === 'max' ? 'الأكبر' : 'الأصغر';
      const q = `فين ${word}؟ ${a} ولا ${b}؟`;
      return {
        topic,
        question: q,
        speak: q,
        answer: ans,
        choices: nc(ans, lo, hi),
        visual: null,
        parts: { a, b, ans, text: q },
      };
    }

    case 'nextnum': {
      const lo = U.min ?? 1;
      const hi = Math.min(U.max ?? 20, Math.max(lo + 1, max));
      const n = R(lo, Math.max(lo, hi - 1));
      const ans = n + 1;
      const q = `إيه اللي بعد ${n}؟`;
      return {
        topic,
        question: q,
        speak: q,
        answer: ans,
        choices: nc(ans, lo, hi + 1),
        visual: null,
        parts: { n, ans, text: q },
      };
    }

    case 'missing': {
      const sum = U.sum ?? Math.min(max, 10);
      const target = Math.max(3, sum);
      const b = R(1, target - 1);
      const ans = target - b;
      const q = `؟ + ${b} = ${target}`;
      return {
        topic,
        question: q,
        speak: `كام زائد ${b} يساوي ${target}؟`,
        answer: ans,
        choices: nc(ans, 0, target),
        visual: null,
        parts: { a: ans, b, ans, text: q },
      };
    }

    case 'shapes': {
      const target = SHAPES[R(0, SHAPES.length - 1)];
      const others = SHAPES.filter((s) => s.emoji !== target.emoji);
      const opts = pickN(others, Math.max(0, choiceCount - 1), R).map((s) => s.emoji);
      const choices = shuffleR([target.emoji, ...opts], R);
      const q = `فين ${target.name}؟`;
      return {
        topic,
        question: q,
        speak: q,
        answer: target.emoji,
        choices,
        visual: null,
        parts: { shape: target.name, ans: target.emoji, text: q },
      };
    }

    case 'patterns': {
      const skip = U.skip;
      if (skip) {
        const step = [2, 5, 10][R(0, 2)];
        const start = R(1, 10);
        const seq = [start, start + step, start + step * 2];
        const ans = start + step * 3;
        const q = `كمّل: ${seq.join('، ')}، ؟`;
        return {
          topic,
          question: q,
          speak: `كمّل العدّ: ${seq.join('، ')}، إيه اللي بعده؟`,
          answer: ans,
          choices: nc(ans, 1, ans + step * 2),
          visual: null,
          parts: { seq, ans, text: q },
        };
      }
      const p = PATTERNS[R(0, PATTERNS.length - 1)];
      const shown = [...p.seq, ...p.seq.slice(0, 1)];
      const others = ['🔴', '🟡', '🔵', '🟢', '⭐', '🌙', '🍎', '🍌'].filter((e) => e !== p.next);
      const opts = pickN(others, Math.max(0, choiceCount - 1), R);
      const q = `كمّل النمط: ${shown.join(' ')} ؟`;
      return {
        topic,
        question: q,
        speak: 'بص على النمط وكمّله، إيه اللي ناقص؟',
        answer: p.next,
        choices: shuffleR([p.next, ...opts], R),
        visual: null,
        parts: { seq: shown, ans: p.next, text: q },
      };
    }

    case 'evenodd': {
      const hi = Math.min(U.max ?? 50, Math.max(10, max));
      const n = R(2, hi);
      const ans = n % 2 === 0 ? 'زوجي' : 'فردي';
      const q = `الرقم ${n} زوجي ولا فردي؟`;
      return {
        topic,
        question: q,
        speak: q,
        answer: ans,
        choices: ['زوجي', 'فردي'],
        visual: null,
        parts: { n, ans, text: q },
      };
    }

    case 'wordProblems': {
      const limit = Math.min(max, U.max ?? 50);
      const twoStep = !!U.twoStep;
      const a = R(2, Math.min(12, limit));
      const b = R(2, Math.min(12, limit));
      const names = ['أحمد', 'مريم', 'يوسف', 'سارة', 'علي'];
      const things = ['كورة ⚽', 'تفاحة 🍎', 'بسكوتة 🍪', 'عصفورة 🐦', 'قصة 📖'];
      const name = names[R(0, names.length - 1)];
      const thing = things[R(0, things.length - 1)];
      if (!twoStep) {
        const ans = a + b;
        const q = `${name} عنده ${a} ${thing}، جاب ${b} كمان. عنده كام؟`;
        return {
          topic,
          question: q,
          speak: q,
          answer: ans,
          choices: nc(ans, 1, ans + 10),
          visual: { type: 'emojis', emoji: '⚽', count: Math.min(ans, 15) },
          parts: { a, b, ans },
        };
      }
      const c = R(1, 5);
      const ans = a + b - c;
      const q = `${name} عنده ${a} ${thing}، جاب ${b} كمان، وأعطى صاحبه ${c}. فاضل معاه كام؟`;
      return {
        topic,
        question: q,
        speak: q,
        answer: ans,
        choices: nc(ans, 0, ans + 10),
        visual: null,
        parts: { a, b, c, ans },
      };
    }

    default: {
      return generateMathQuestion('addition', ageGroup, opts);
    }
  }
}
