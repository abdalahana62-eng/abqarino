// Pure word-question builder: wrong options come from the SAME category
// but are visually distinct (different first letter preferred: بقرة ← حصان,
// not بقرة ← عجل). No imports from app code except shuffle (dependency-free).
import { shuffle } from '../data/vocab.js';

function head(s) {
  return String(s || '').trim().charAt(0);
}

export function buildWordOptions(pool, targetEn, opts = {}) {
  const lang = opts.lang === 'en' ? 'en' : 'ar';
  const count = Math.max(2, opts.count ?? 4);
  const target = (pool || []).find((p) => p.en === targetEn);
  if (!target) return [];
  const tHead = head(lang === 'ar' ? target.ar : target.en);
  const others = pool.filter((p) => p.en !== targetEn);
  const distinct = others.filter((p) => head(lang === 'ar' ? p.ar : p.en) !== tHead);
  const rest = others.filter((p) => head(lang === 'ar' ? p.ar : p.en) === tHead);
  const take = [
    ...shuffle(distinct).slice(0, Math.max(0, count - 1)),
  ];
  if (take.length < count - 1) {
    take.push(...shuffle(rest).slice(0, count - 1 - take.length));
  }
  const options = shuffle([target, ...take]).map((o) => ({
    key: o.en,
    text: lang === 'ar' ? o.ar : o.en,
    emoji: o.emoji,
  }));
  return options;
}
