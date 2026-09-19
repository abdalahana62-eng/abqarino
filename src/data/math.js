import { shuffle } from './vocab';

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const COUNT_EMOJIS = ['🐰','🍎','⭐','🐱','🐶','🌻','🎈','🍭','🐟','🦋'];

function numberChoices(answer, min, max) {
  const set = new Set([answer]);
  let guard = 0;
  while (set.size < 4 && guard++ < 200) {
    const spread = Math.max(1, Math.floor(Math.abs(answer) * 0.3) + 2);
    const v = rnd(Math.max(min, answer - spread), Math.min(max, answer + spread));
    if (v !== answer) set.add(v);
  }
  while (set.size < 4) set.add(rnd(min, max));
  return shuffle([...set]);
}

function fractionChoices(answer) {
  const options = ['1/2','1/3','1/4','2/3','3/4','2/4','1/5','2/5'];
  const set = new Set([answer]);
  for (const o of shuffle(options)) {
    if (set.size >= 4) break;
    set.add(o);
  }
  return shuffle([...set]);
}

export function generateMathQuestion(topic, ageGroup) {
  const max = ageGroup?.maxNum ?? 20;

  switch (topic) {
    case 'counting': {
      const n = rnd(3, Math.min(max, 12));
      const emoji = COUNT_EMOJIS[rnd(0, COUNT_EMOJIS.length - 1)];
      return {
        topic,
        question: 'كام واحد في الصورة؟',
        speak: 'عدّ معايا، كام واحد؟',
        answer: n,
        choices: numberChoices(n, 1, Math.min(max, 20)),
        visual: { type: 'emojis', emoji, count: n },
        parts: { n, ans: n },
      };
    }

    case 'addition': {
      const limit = Math.min(max, 50);
      const a = rnd(1, Math.floor(limit / 2));
      const b = rnd(1, Math.floor(limit / 2));
      const ans = a + b;
      return {
        topic,
        question: `${a} + ${b} = ؟`,
        speak: `${a} زائد ${b} يساوي كام؟`,
        answer: ans,
        choices: numberChoices(ans, 1, limit + 10),
        visual: null,
        parts: { a, b, ans },
      };
    }

    case 'subtraction': {
      const limit = Math.min(max, 50);
      const a = rnd(3, limit);
      const b = rnd(1, a - 1);
      const ans = a - b;
      return {
        topic,
        question: `${a} − ${b} = ؟`,
        speak: `${a} ناقص ${b} يساوي كام؟`,
        answer: ans,
        choices: numberChoices(ans, 0, limit),
        visual: null,
        parts: { a, b, ans },
      };
    }

    case 'multiplication': {
      const a = rnd(2, 10);
      const b = rnd(2, 10);
      const ans = a * b;
      return {
        topic,
        question: `${a} × ${b} = ؟`,
        speak: `${a} في ${b} يساوي كام؟`,
        answer: ans,
        choices: numberChoices(ans, 1, ans + 20),
        visual: null,
        parts: { a, b, ans },
      };
    }

    case 'division': {
      const b = rnd(2, 10);
      const ans = rnd(2, 10);
      const a = b * ans;
      return {
        topic,
        question: `${a} ÷ ${b} = ؟`,
        speak: `${a} على ${b} يساوي كام؟`,
        answer: ans,
        choices: numberChoices(ans, 1, 15),
        visual: null,
        parts: { a, b, ans },
      };
    }

    case 'fractions': {
      const denominator = rnd(2, 4) === 2 ? 2 : rnd(3, 4);
      const numerator = rnd(1, denominator - 1);
      const answer = `${numerator}/${denominator}`;
      return {
        topic,
        question: 'إيه الكسر اللي في الشكل؟',
        speak: 'إيه الكسر اللي في الشكل؟',
        answer,
        choices: fractionChoices(answer),
        visual: { type: 'fraction', numerator, denominator },
        parts: { num: numerator, den: denominator, ans: answer },
      };
    }

    case 'wordProblems': {
      const a = rnd(2, 12);
      const b = rnd(2, 12);
      const ans = a + b;
      const names = ['أحمد', 'مريم', 'يوسف', 'سارة', 'علي'];
      const name = names[rnd(0, names.length - 1)];
      return {
        topic,
        question: `${name} عنده ${a} كورة، جابه ${b} كورة كمان. عنده كام كورة؟`,
        speak: `${name} عنده ${a} كورة، وجابه ${b} كورة كمان. عنده كام كورة؟`,
        answer: ans,
        choices: numberChoices(ans, 1, ans + 10),
        visual: { type: 'emojis', emoji: '⚽', count: Math.min(ans, 15) },
        parts: { a, b, ans },
      };
    }

    default: {
      return generateMathQuestion('addition', ageGroup);
    }
  }
}
