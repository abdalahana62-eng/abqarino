import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import PHRASES from '../content/phrases.json';

// Warm interactive teacher voice for Abqarino.
// - Egyptian Arabic voice (ar-EG) when available, slower clear rate, warm pitch.
// - Every language spoken ALONE: arabic utterances never overlap english ones,
//   sequences are chained (next starts only after previous finishes).
// - stop-before-speak everywhere so speech never piles up / becomes unclear.

let cachedVoices = [];
let seqToken = 0;

async function refreshVoices() {
  try {
    cachedVoices = await Speech.getAvailableVoicesAsync();
  } catch {
    // keep old cache
  }
}
refreshVoices();

function findVoice(preds) {
  for (const p of preds) {
    const v = cachedVoices.find(p);
    if (v) return v.identifier || v.name;
  }
  return undefined;
}

function voiceAr() {
  return findVoice([
    (v) => v.language === 'ar-EG',
    (v) => (v.language || '').startsWith('ar-EG'),
    (v) => /egypt/i.test(v.name || ''),
    (v) => v.language === 'ar-SA',
    (v) => (v.language || '').startsWith('ar'),
    (v) => /arab/i.test(v.name || ''),
  ]);
}

function voiceEn() {
  return findVoice([
    (v) => v.language === 'en-US',
    (v) => (v.language || '').startsWith('en'),
  ]);
}

function rawSpeak(text, { language, rate, pitch, voice, onDone, onStopped, onError }) {
  try {
    Speech.stop();
    Speech.speak(text, {
      language, rate, pitch, voice,
      onDone, onStopped, onError,
    });
  } catch {
    onDone?.();
  }
}

export function speakAr(text, opts = {}) {
  seqToken += 1; // cancel any running sequence
  rawSpeak(text, {
    language: 'ar-EG', rate: 0.88, pitch: 1.12, voice: voiceAr(), ...opts,
  });
}

export function speakEn(text, opts = {}) {
  seqToken += 1;
  rawSpeak(text, {
    language: 'en-US', rate: 0.8, pitch: 1.1, voice: voiceEn(), ...opts,
  });
}

// Speak items one-by-one: [{ kind: 'ar'|'en', text }]. Next starts only
// after the previous FINISHES (with a small natural pause between).
// Safety timeout moves on if the OS never reports completion.
export function speakSequence(items, gapMs = 350) {
  const my = ++seqToken;
  try { Speech.stop(); } catch { /* noop */ }
  const estMs = (t) => Math.min(9000, 1200 + String(t).length * 95);
  let i = 0;
  const next = () => {
    if (my !== seqToken) return;
    if (i >= items.length) return;
    const it = items[i++];
    const isAr = it.kind !== 'en';
    let settled = false;
    const done = () => {
      if (settled || my !== seqToken) return;
      settled = true;
      setTimeout(next, gapMs);
    };
    setTimeout(done, estMs(it.text)); // fallback
    rawSpeak(it.text, {
      language: isAr ? 'ar-EG' : 'en-US',
      rate: isAr ? 0.88 : 0.8,
      pitch: 1.12,
      voice: isAr ? voiceAr() : voiceEn(),
      onDone: done, onStopped: done, onError: done,
    });
  };
  next();
}

export function stopSpeech() {
  seqToken += 1;
  try { Speech.stop(); } catch { /* noop */ }
}

// ---- Teacher persona lines (Egyptian dialect, warm) ----
// Texts live in src/content/phrases.json (data); this only fills {name} etc.
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fill = (t, vars) =>
  String(t).replace('{name}', vars?.name ?? 'صديقي').replace('{score}', vars?.score ?? '').replace('{total}', vars?.total ?? '');

export const teacher = {
  greet: (name) => fill(pick(PHRASES.teacher.greet), { name }),
  praise: (name) => fill(pick(PHRASES.teacher.praise), { name }),
  encourage: (name) => fill(pick(PHRASES.teacher.encourage), { name }),
  reveal: (answer) => `الإجابة الصح ${answer}. افتكرها يا بطل!`,
  askIntro: () => pick(PHRASES.teacher.askIntro),
  farewell: (name, score, total) =>
    score >= total / 2
      ? fill(pick(PHRASES.teacher.farewellGood), { name, score, total })
      : fill(pick(PHRASES.teacher.farewellTry), { name, score, total }),
};

export const retryLine = () => pick(PHRASES.retry);
export const praiseWord = () => pick(PHRASES.praise);

export function tap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
export function hapticError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
