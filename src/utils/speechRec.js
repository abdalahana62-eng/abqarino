// Microphone speech recognition (web SpeechRecognition API).
// Native: unsupported → caller uses the parent-confirm fallback.
export function isListeningSupported() {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function normalizeSpeech(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/[^a-z\u0600-\u06FF0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesSpoken(transcript, target) {
  const t = normalizeSpeech(transcript);
  const g = normalizeSpeech(target);
  if (!t || !g) return false;
  return t.includes(g) || g.includes(t);
}

// Listen once for up to timeoutMs. Resolves { transcript } or { error }.
export function listenOnce(lang = 'en-US', timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        resolve({ error: 'unsupported' });
        return;
      }
      const rec = new SR();
      rec.lang = lang;
      rec.interimResults = false;
      rec.maxAlternatives = 3;
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true;
        try { rec.onresult = null; rec.onerror = null; rec.onend = null; } catch { /* noop */ }
        try { rec.stop(); } catch { /* noop */ }
        resolve(v);
      };
      const alts = [];
      rec.onresult = (e) => {
        for (const r of e.results) {
          for (const a of r) alts.push(a.transcript);
        }
        if (e.results[e.results.length - 1]?.isFinal) finish({ transcript: alts.join(' ') });
      };
      rec.onerror = (e) => finish({ error: e?.error || 'rec-error' });
      rec.onend = () => finish(alts.length ? { transcript: alts.join(' ') } : { error: 'no-speech' });
      rec.start();
      setTimeout(() => finish(alts.length ? { transcript: alts.join(' ') } : { error: 'no-speech' }), timeoutMs);
    } catch {
      resolve({ error: 'unsupported' });
    }
  });
}
