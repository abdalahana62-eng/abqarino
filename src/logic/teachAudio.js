// Audio helpers for the teaching engine: spoken line that resolves exactly
// when the voice FINISHES (expo-speech onDone / web onend), with a length
// based timeout fallback. Never throws: text stays on screen if audio fails.
import * as Speech from 'expo-speech';
import { stopVoice } from '../utils/voice.js';
import { SCENE_CLIPS } from '../utils/sceneClips.js';
import { Audio } from 'expo-av';

export function stopAllAudio() {
  try {
    Speech.stop();
  } catch { /* noop */ }
  stopClip();
  stopVoice().catch(() => {});
}

// Bidirectional numerals the app uses: keep the given digits, speak Arabic.
// Exact scene lines play their bundled Salma clip; anything else falls back
// to device TTS. Resolves when finished; never throws.
export function speakText(text, lang = 'ar-EG') {
  const src = SCENE_CLIPS[String(text)];
  if (src) return playClip(src);
  return speakDevice(text, lang);
}

async function playClip(src) {
  try {
    const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: true });
    clipSound = sound;
    await new Promise((resolve) => {
      let done = false;
      const fin = () => {
        if (done) return;
        done = true;
        try { sound.setOnPlaybackStatusUpdate(null); } catch { /* noop */ }
        sound.unloadAsync().catch(() => {});
        if (clipSound === sound) clipSound = null;
        resolve();
      };
      sound.setOnPlaybackStatusUpdate((st) => {
        if (st.didJustFinish) fin();
      });
      setTimeout(fin, 15000);
    });
  } catch { /* show text only */ }
}

let clipSound = null;

export function stopClip() {
  const s = clipSound;
  clipSound = null;
  if (s) s.unloadAsync().catch(() => {});
}

function speakDevice(text, lang) {
  const isAr = String(lang).startsWith('ar');
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
