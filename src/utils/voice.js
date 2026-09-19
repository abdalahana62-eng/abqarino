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
    }
    case 'fractions': {
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
    default: return [{ key: '__missing__', fb: { kind: 'ar', text: p.question } }];
  }
}
