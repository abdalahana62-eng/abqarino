// Web-safe version of speech.js (used automatically on web instead of expo-speech/expo-haptics)
function pickVoice(langPrefix) {
  try {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    return voices.find((v) => v.lang?.startsWith(langPrefix)) || null;
  } catch {
    return null;
  }
}

function speak(text, lang) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const voice = pickVoice(lang.split('-')[0]);
    if (voice) u.voice = voice;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    // no-op on unsupported browsers
  }
}

export function speakAr(text) {
  speak(text, 'ar-EG');
}

export function speakEn(text) {
  speak(text, 'en-US');
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
