// Web-safe speech + haptics (used automatically on web).
// Clear Arabic voice: preload voices (they load async), prefer a natural
// Arabic voice (ar-SA → ar-EG → any ar), neutral pitch, steady rate.
let cachedVoices = [];

function loadVoices() {
  try {
    cachedVoices = window.speechSynthesis?.getVoices?.() || [];
  } catch {
    cachedVoices = [];
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  try {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  } catch {
    // ignore
  }
}

function pickVoiceAr() {
  const vs = cachedVoices.length ? cachedVoices : loadVoices() || [];
  const list = cachedVoices.length ? cachedVoices : vs;
  return (
    list.find((v) => v.lang === 'ar-SA') ||
    list.find((v) => v.lang && v.lang.startsWith('ar-SA')) ||
    list.find((v) => v.lang === 'ar-EG') ||
    list.find((v) => v.lang && v.lang.startsWith('ar')) ||
    list.find((v) => /arab/i.test(v.name || '')) ||
    null
  );
}

function pickVoiceEn() {
  const list = cachedVoices;
  return (
    list.find((v) => v.lang === 'en-US') ||
    list.find((v) => v.lang && v.lang.startsWith('en-US')) ||
    list.find((v) => v.lang && v.lang.startsWith('en')) ||
    null
  );
}

function speak(text, lang, voice, rate) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  } catch {
    // no-op on unsupported browsers
  }
}

export function speakAr(text) {
  speak(text, 'ar-SA', pickVoiceAr(), 0.95);
}

export function speakEn(text) {
  speak(text, 'en-US', pickVoiceEn(), 0.9);
}

export function stopSpeech() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // no-op
  }
}

function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // no-op
  }
}

export function tap() {
  vibrate(10);
}
export function hapticSuccess() {
  vibrate([30, 50, 30]);
}
export function hapticError() {
  vibrate([80, 50, 80]);
}
