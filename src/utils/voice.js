import { Audio } from 'expo-av';
import { CLIPS, HAS } from './voiceClips';
import { speakAr as devAr, speakEn as devEn, stopSpeech as devStop } from './speech';

// Unified teacher voice: bundled Gemini clips first, device TTS fallback
// for anything not generated yet. Everything is awaitable so the game
// can wait until the teacher FINISHES talking before moving on.

let sound = null;
let seqId = 0;

async function unload() {
  const s = sound;
  sound = null;
  try { await s?.unloadAsync(); } catch { /* noop */ }
}

export async function stopVoice() {
  seqId += 1;
  await unload();
  devStop();
}

export function hasClip(key) {
  return HAS(key);
}

// Play one clip (or device fallback). Resolves when finished.
export async function playKey(key, fallback = null) {
  // fallback: { kind: 'ar'|'en', text, ms } — spoken by device TTS.
  const id = ++seqId;
  await unload();
  devStop();
  const src = CLIPS[key];
  if (!src) {
    if (fallback?.text) {
      if (fallback.kind === 'en') devEn(fallback.text);
      else devAr(fallback.text);
      await sleep(fallback.ms || Math.min(8000, 1200 + String(fallback.text).length * 110));
    }
    return;
  }
  try {
    const { sound: s } = await Audio.Sound.createAsync(src, { shouldPlay: true });
    if (id !== seqId) {
      try { await s.unloadAsync(); } catch { /* noop */ }
      return;
    }
    sound = s;
    await new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        try { s.setOnPlaybackStatusUpdate(null); } catch { /* noop */ }
        if (sound === s) sound = null;
        s.unloadAsync().catch(() => {});
        resolve();
      };
      s.setOnPlaybackStatusUpdate((st) => {
        if (st.didJustFinish) finish();
      });
      setTimeout(finish, 12000); // safety
    });
  } catch {
    if (fallback?.text) {
      if (fallback.kind === 'en') devEn(fallback.text);
      else devAr(fallback.text);
      await sleep(fallback.ms || 2500);
    }
  }
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Play keys in order with a small natural pause. Stops if stopVoice() called.
export async function playSeq(keys, gapMs = 320) {
  const id = seqId;
  for (const k of keys) {
    if (id !== seqId) return;
    if (typeof k === 'string') {
      await playKey(k);
    } else {
      await playKey(k.key, k.fb);
    }
    if (id !== seqId) return;
    await sleep(gapMs);
  }
}

const rnd = (n) => 1 + Math.floor(Math.random() * n);
const pickExisting = (base, max) => {
  const have = [];
  for (let i = 1; i <= max; i++) if (HAS(`${base}${i}`)) have.push(`${base}${i}`);
  if (have.length) return have[Math.floor(Math.random() * have.length)];
  return `${base}1`;
};
export const keys = {
  greet: () => 'greet',
  praise: () => pickExisting('praise', 5),
  encourage: () => pickExisting('encourage', 3),
  ask: () => pickExisting('ask', 3),
  num: (n) => (Number.isInteger(n) && n >= 0 && n <= 120 && HAS(`n${n}`) ? `n${n}` : null),
};

// Build a composed explanation (list of keys / fallbacks) per math topic.
// qParts: normalized operands from generateMathQuestion.
export function explainKeys(topic, p) {
  const K = (key, text, kind = 'ar') =>
    HAS(key) ? key : { key: '__missing__', fb: { kind, text } };
  const N = (n, spoken) =>
    HAS(`n${n}`) ? `n${n}` : { key: '__missing__', fb: { kind: 'ar', text: spoken || String(n) } };
  const R = (ans, spoken) => [K('reveal.wav', 'الإجابة الصح'), N(ans, spoken)];
  switch (topic) {
    case 'addition': {
      const big = Math.max(p.a, p.b);
      const small = Math.min(p.a, p.b);
      const steps = [];
      for (let i = 1; i <= small; i++) steps.push(N(big + i));
      return [
        K('teach_intro.wav', 'بص يا بطل، هعلمك تحلها إزاي!'),
        K('t_put.wav', 'حط'), N(big), K('t_inmind.wav', 'في مخك'),
        K('t_takeout.wav', 'وطلع'), N(small), K('t_fingers.wav', 'على صوابعك'),
        K('t_countafter.wav', 'وعد من بعده'),
        ...steps,
        ...R(p.ans),
      ];
    }
    case 'subtraction': {
      const steps = [];
      for (let i = p.b + 1; i <= p.a; i++) steps.push(N(i));
      return [
        K('teach_intro.wav', 'بص يا بطل، هعلمك تحلها إزاي!'),
        K('t_startfrom.wav', 'ابدأ من'), N(p.b),
        K('t_countupto.wav', 'وعد لحد'), N(p.a),
        ...steps,
        ...R(p.ans),
      ];
    }
    case 'multiplication': {
      const steps = [];
      for (let i = 1; i <= p.b; i++) steps.push(N(p.a * i));
      return [
        K('teach_intro.wav', 'بص يا بطل، هعلمك تحلها إزاي!'),
        K('t_timesmeans.wav', 'الضرب ده معناه'), N(p.a),
        K('t_repeated.wav', 'متكررة'), N(p.b), K('t_timesN.wav', 'مرات'),
        K('t_saywithme.wav', 'قول معايا'),
        ...steps,
        ...R(p.ans),
      ];
    }
    case 'division': {
      const steps = [];
      for (let i = 1; i <= p.ans; i++) steps.push(N(p.b * i));
      return [
        K('teach_intro.wav', 'بص يا بطل، هعلمك تحلها إزاي!'),
        K('t_think.wav', 'فكر معايا يا بطل'), N(p.b),
        K('t_timeswhat.wav', 'في كام يدينا'), N(p.a),
        ...steps,
        ...R(p.ans),
      ];
    }
    case 'counting': {
      const steps = [];
      for (let i = 1; i <= p.n; i++) steps.push(N(i));
      return [
        K('teach_intro.wav', 'بص يا بطل، هعلمك تحلها إزاي!'),
        K('t_counttogether.wav', 'يلا نعد مع بعض'),
        ...steps,
        ...R(p.ans),
      ];
    }    case 'fractions': {
      return [
        K('teach_intro.wav', 'بص يا بطل، هعلمك تحلها إزاي!'),
        K('t_lookshape.wav', 'بص للشكل يا بطل'),
        K('t_divided.wav', 'متقسم'), N(p.den),
        K('t_parts.wav', 'حتت'),
        K('t_colored.wav', 'ومتلون منهم'), N(p.num),
        K('t_sofraction.wav', 'يبقى الكسر'),
        N(p.num), K('divide.wav', 'على'), N(p.den),
      ];
    }
    case 'compare': {
      return [
        K('teach_intro.wav', 'بص يا بطل، هعلمك تحلها إزاي!'),
        K('__q__', p.text || `فين الأكبر؟ ${p.a} ولا ${p.b}؟`),
        ...R(p.ans),
      ];
    }
    case 'nextnum': {
      return [
        K('teach_intro.wav', 'بص يا بطل، هعلمك تحلها إزاي!'),
        N(p.n),
        K('t_countafter.wav', 'وعد من بعده'),
        N(p.n + 1),
        ...R(p.ans),
      ];
    }
    case 'missing': {
      const target = (p.a ?? 0) + (p.b ?? 0);
      const steps = [];
      if (p.b != null && (p.a ?? 0) <= 12) {
        for (let i = p.b + 1; i <= target; i++) steps.push(N(i));
      }
      return [
        K('teach_intro.wav', 'بص يا بطل، هعلمك تحلها إزاي!'),
        K('t_put.wav', 'حط'), N(p.b ?? 0),
        K('t_inmind.wav', 'في مخك'),
        K('t_countupto.wav', 'وعد لحد'), N(target),
        ...steps,
        ...R(p.ans),
      ];
    }
    case 'shapes': {
      return [
        K('teach_intro.wav', 'بص يا بطل، هعلمك تحلها إزاي!'),
        K('__q__', `دور على ${p.shape || 'الشكل'} يا بطل! الإجابة هي ${p.shape || 'الشكل'}`),
      ];
    }
    case 'patterns': {
      return [
        K('teach_intro.wav', 'بص يا بطل، هعلمك تحلها إزاي!'),
        K('__q__', 'بص على النمط كويس وامشي معاه واحدة واحدة، هتعرف إيه اللي ناقص'),
      ];
    }
    case 'evenodd': {
      const even = p.n % 2 === 0;
      return [
        K('teach_intro.wav', 'بص يا بطل، هعلمك تحلها إزاي!'),
        K('__q__', even ? `الرقم ${p.n} بيتقسم اتنينات من غير ما يفضل حاجة، يبقى زوجي` : `الرقم ${p.n} بيفضل منه واحد لوحده، يبقى فردي`),
      ];
    }
    default: {
      return [K('t_addthem.wav', 'اجمع الرقمين على بعض'), ...R(p.ans)];
    }
  }
}

// Audio keys for one vocab item: [arabic clip, english clip] with fallback.
export function vocabKeys(topic, idx, arText, enKey) {
  let arFile;
  if (topic === 'sentences') arFile = `ar_S${idx + 1}`;
  else if (topic === 'food' && enKey === 'Orange') arFile = 'ar_Orange2';
  else arFile = `ar_${enKey}`;
  const slug = String(enKey).toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 28);
  return [
    HAS(arFile) ? arFile : { key: '__missing__', fb: { kind: 'ar', text: arText } },
    HAS(`en_${slug}`) ? `en_${slug}` : { key: '__missing__', fb: { kind: 'en', text: enKey } },
  ];
}
// Small helpers for composed utterances (clip if generated, device fallback).
export const C = (key, text) => (HAS(key) ? key : { key: '__missing__', fb: { kind: 'ar', text } });
export const CN = (n) =>
  Number.isInteger(n) && n >= 0 && n <= 120 && HAS(`n${n}`)
    ? `n${n}`
    : { key: '__missing__', fb: { kind: 'ar', text: String(n) } };

// Phased teaching plan for THE SAME failed problem.
// Returns null when numbers are too big (falls back to verbal explanation).
// themeAt(i) supplies the rotating drag theme per step.
export function teachSteps(topic, p, themeAt) {
  if (!p) return null;
  const putIn = (n, more) => [
    C('t_put.wav', 'حط'), CN(n),
    ...(more ? [C('t_more.wav', 'كمان')] : []),
    C('t_inbasket.wav', 'في السلة'),
  ];
  switch (topic) {
    case 'counting': {
      if (p.n < 1 || p.n > 12) return null;
      const t = themeAt(0);
      return [{ mode: 'collect', n: p.n, base: 0, theme: t, hint: t.hint, say: [{ key: t.instr, fb: { kind: 'ar', text: `${t.hint}، وعد معايا يا بطل!` } }] }];
    }
    case 'addition':
    case 'wordProblems': {
      const { a, b, ans } = p;
      if (a == null || b == null || a > 10 || b > 10 || ans > 16) return null;
      const t0 = themeAt(0);
      const t1 = themeAt(1);
      return [
        { mode: 'collect', n: a, base: 0, theme: t0, hint: `الأول حط ${a}`, badge: 'الجزء الأول', say: putIn(a, false) },
        { mode: 'collect', n: b, base: a, theme: t1, hint: `كمل وزود ${b}`, badge: 'الجزء التاني', say: putIn(b, true) },
      ];
    }
    case 'subtraction': {
      const { a, b } = p;
      if (a == null || b == null || a > 14 || b < 1) return null;
      const t0 = themeAt(0);
      return [
        {
          mode: 'remove', show: a, take: b, theme: t0,
          hint: `شيل ${b} منهم`, badge: `كانوا ${a}`,
          say: [C('t_take.wav', 'شيل'), CN(b), C('t_fromthem.wav', 'منهم'), C('t_tobox.wav', 'وحطهم في الصندوق')],
        },
        {
          mode: 'count', from: 'field', limit: a - b, theme: t0,
          hint: 'عد اللي فاضل', badge: 'الباقي = الإجابة',
          say: [C('t_countrest.wav', 'عد اللي فاضل معايا')],
        },
      ];
    }
    case 'multiplication': {
      const { a, b, ans } = p;
      if (a == null || b == null || a > 6 || b > 4 || ans > 16) return null;
      const steps = [];
      for (let r = 0; r < b; r++) {
        const t = themeAt(r);
        steps.push({
          mode: 'collect', n: a, base: a * r, theme: t,
          hint: r === 0 ? `حط ${a}` : `كمان ${a} (مرة ${r + 1})`,
          badge: `المرة ${r + 1} من ${b}`,
          say: putIn(a, r > 0),
        });
      }
      return steps;
    }
    case 'division': {
      const { a, b, ans } = p;
      if (a == null || a > 14) return null;
      const t = themeAt(0);
      const chant = [];
      for (let i = 1; i <= ans; i++) chant.push(CN(b * i));
      const steps = [
        { mode: 'collect', n: a, base: 0, theme: t, hint: `حط ${a} كلهم`, badge: 'اجمعهم الأول', say: putIn(a, false) },
      ];
      steps.tail = [C('t_think.wav', 'فكر معايا يا بطل'), CN(b), C('t_timeswhat.wav', 'في كام يدينا'), CN(a), ...chant, C('reveal.wav', 'الإجابة الصح'), CN(ans)];
      return steps;
    }
    case 'fractions': {
      const { num, den } = p;
      if (num == null || den == null) return null;
      const t = themeAt(0);
      return [
        { mode: 'collect', n: den, base: 0, theme: t, hint: `حط ${den} حتت`, badge: 'أجزاء الشكل', say: putIn(den, false) },
        {
          mode: 'count', from: 'bin', limit: num, theme: t,
          hint: `عد المتلون: ${num}`, badge: 'المتلون = الإجابة',
          say: [C('t_colored.wav', 'ومتلون منهم'), CN(num)],
        },
      ];
    }
    default:
      return null;
  }
}
// Play one vocabulary word, Arabic then English, never overlapping.
// Resolution order per language (first hit wins):
//   1. assets/audio/ar|en/{id}.mp3 recorded files (future; see REPORT.md),
//   2. bundled Gemini wavs (ar_{en} / en_{slug}),
//   3. device TTS. Never throws: shows text only if audio fails.
export async function playWord(word) {
  if (!word) return;
  const slug = String(word.en || '').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 28);
  const arKey = `ar_${word.en}`;
  const enKey = `en_${slug}`;
  await playSeq([
    HAS(arKey) ? arKey : { key: '__missing__', fb: { kind: 'ar', text: word.ar } },
    HAS(enKey) ? enKey : { key: '__missing__', fb: { kind: 'en', text: word.en } },
  ]);
}
// Question reading as composed clips (with device fallback per piece).
export function questionKeys(topic, p) {
  const K = (key, text, kind = 'ar') =>
    HAS(key) ? key : { key: '__missing__', fb: { kind, text } };
  const N = (n) => (HAS(`n${n}`) ? `n${n}` : { key: '__missing__', fb: { kind: 'ar', text: String(n) } });
  switch (topic) {
    case 'addition': return [K(keys.ask(), 'يلا يا بطل'), N(p.a), K('plus.wav', 'زائد'), N(p.b), K('eqwhat.wav', 'يساوي كام؟')];
    case 'subtraction': return [K(keys.ask(), 'يلا يا بطل'), N(p.a), K('minus.wav', 'ناقص'), N(p.b), K('eqwhat.wav', 'يساوي كام؟')];
    case 'multiplication': return [K(keys.ask(), 'يلا يا بطل'), N(p.a), K('times.wav', 'في'), N(p.b), K('eqwhat.wav', 'يساوي كام؟')];
    case 'division': return [K(keys.ask(), 'يلا يا بطل'), N(p.a), K('divide.wav', 'على'), N(p.b), K('eqwhat.wav', 'يساوي كام؟')];
    case 'counting': return [K(keys.ask(), 'يلا يا بطل'), K('howmany.wav', 'كام واحد في الصورة؟')];
    case 'fractions': return [K(keys.ask(), 'يلا يا بطل'), K('fracq.wav', 'إيه الكسر اللي في الشكل؟')];
    case 'compare':
    case 'nextnum':
    case 'missing':
    case 'shapes':
    case 'patterns':
    case 'evenodd':
      return [K(keys.ask(), 'يلا يا بطل'), K('__q__', p.text || p.question || '')];
    default: return [{ key: '__missing__', fb: { kind: 'ar', text: p.text || p.question || '' } }];
  }
}
