// Audio helpers for the teaching engine: spoken line that resolves exactly
// when the voice FINISHES (expo-speech onDone / web onend), with a length
// based timeout fallback. Never throws: text stays on screen if audio fails.
import * as Speech from 'expo-speech';
import { stopVoice } from '../utils/voice.js';

export function stopAllAudio() {
  try {
    Speech.stop();
  } catch { /* noop */ }
  stopVoice().catch(() => {});
}

// Bidirectional numerals the app uses: keep the given digits, speak Arabic.
export function speakText(text, lang = 'ar-EG') {
  const isAr = lang.startsWith('ar');
  return new Promise((resolve) => {
    let done = false;
    const fin = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    try {
      Speech.stop();
      Speech.speak(String(text), {
        language: lang,
        rate: isAr ? 0.85 : 0.78,
        pitch: 1.12,
        onDone: fin,
        onStopped: fin,
        onError: fin,
      });
      setTimeout(fin, Math.min(15000, 1500 + String(text).length * 120));
    } catch {
      fin();
    }
  });
}

const OP_WORDS = { '+': 'زائد', '-': 'ناقص', '×': 'في', '*': 'في', '÷': 'على', '/': 'على', '=': 'يساوي' };

export function partSpeech(part) {
  if (!part) return null;
  if (part.t === 'num') return { kind: 'num', value: Number(part.v) };
  if (part.t === 'op' || part.t === 'eq') {
    return { kind: 'word', value: OP_WORDS[part.v] || String(part.v) };
  }
  return null;
}
