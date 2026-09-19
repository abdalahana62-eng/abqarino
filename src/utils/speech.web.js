// Web-safe speech + haptics (used automatically on web).
// Same API as speech.js: clear Egyptian Arabic voice, warm pitch,
// every language spoken ALONE via chained sequences, stop-before-speak.
let cachedVoices = [];
let seqToken = 0;

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
  const list = cachedVoices;
  return (
    list.find((v) => v.lang === 'ar-EG') ||
    list.find((v) => v.lang && v.lang.startsWith('ar-EG')) ||
    list.find((v) => /egypt/i.test(v.name || '')) ||
    list.find((v) => v.lang === 'ar-SA') ||
    list.find((v) => v.lang && v.lang.startsWith('ar')) ||
    list.find((v) => /arab/i.test(v.name || '')) ||
    null
  );
}

function pickVoiceEn() {
  const list = cachedVoices;
  return (
    list.find((v) => v.lang === 'en-US') ||
    list.find((v) => v.lang && v.lang.startsWith('en')) ||
    null
  );
}

function rawSpeak(text, { lang, voice, rate, onEnd }) {
  try {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = 1.12;
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      try { u.onend = null; u.onerror = null; } catch { /* noop */ }
      onEnd?.();
    };
    u.onend = done;
    u.onerror = done;
    setTimeout(done, Math.min(9000, 1200 + String(text).length * 95)); // fallback
    window.speechSynthesis.speak(u);
  } catch {
    onEnd?.();
  }
}

export function speakAr(text) {
  seqToken += 1;
  rawSpeak(text, { lang: 'ar-EG', voice: pickVoiceAr(), rate: 0.88, onEnd: null });
}

export function speakEn(text) {
  seqToken += 1;
  rawSpeak(text, { lang: 'en-US', voice: pickVoiceEn(), rate: 0.8, onEnd: null });
}

export function speakSequence(items, gapMs = 350) {
  const my = ++seqToken;
  try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
  let i = 0;
  const next = () => {
    if (my !== seqToken) return;
    if (i >= items.length) return;
    const it = items[i++];
    const isAr = it.kind !== 'en';
    rawSpeak(it.text, {
      lang: isAr ? 'ar-EG' : 'en-US',
      voice: isAr ? pickVoiceAr() : pickVoiceEn(),
      rate: isAr ? 0.88 : 0.8,
      onEnd: () => {
        if (my !== seqToken) return;
        setTimeout(next, gapMs);
      },
    });
  };
  next();
}

export function stopSpeech() {
  seqToken += 1;
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // no-op
  }
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const teacher = {
  greet: (name) => `أهلا يا ${name} يا بطل! أنا عبقرينو، هنتعلم ونلعب مع بعض!`,
  praise: (name) => pick([
    `برافو عليك يا ${name}!`,
    `ممتاز يا ${name}! إجابة صحيحة!`,
    `الله عليك يا بطل! شاطر أوي!`,
    `عظيم يا ${name}! مخك شغال!`,
    `يا سلام عليك! كده تمام!`,
  ]),
  encourage: (name) => pick([
    `معلش يا ${name}، حاول تاني، انت تقدر!`,
    `قربت أوي يا بطل! ركز وحاول مرة كمان!`,
    `ولا يهمك يا حبيبي! الشطار بيغلطوا ويتعلموا!`,
  ]),
  reveal: (answer) => `الإجابة الصح ${answer}. افتكرها يا بطل!`,
  askIntro: () => pick([
    'يلا يا بطل، اسمع السؤال:',
    'ركز معايا يا شاطر:',
    'سؤال جديد يا بطل:',
  ]),
  farewell: (name, score, total) =>
    score >= total / 2
      ? `لعب جميل يا ${name}! جبت ${score} من ${total}! عبقرينو فخور بيك!`
      : `حاولت كويس يا ${name}! جبت ${score} من ${total}. العب تاني وهتبقى أحسن!`,
};

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
