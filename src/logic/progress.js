// Pure progress computations over the stored progress object.
// Shape: { stars, byTopic: {key:{correct,wrong}}, units: {unitId:{correct,total,stars}}, boxes: {itemId:{box,dueAt}}, daily: { date: 'YYYY-MM-DD', ms } }
// Storage IO lives in src/utils/storage.js; everything here is side-effect free.
import { starsFor, lessonComplete } from './difficulty.js';
import { recordAnswer } from './spacedRepetition.js';

export const DEFAULT_DAILY_LIMIT_MS = 15 * 60 * 1000;

export function todayKey(now = Date.now()) {
  const d = new Date(now);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Record one finished lesson; returns a NEW progress object (no mutation).
export function recordLesson(progress, unitId, correct, total, now = Date.now()) {
  const p = {
    stars: progress?.stars ?? 0,
    byTopic: { ...(progress?.byTopic || {}) },
    units: { ...(progress?.units || {}) },
    boxes: { ...(progress?.boxes || {}) },
    daily: { ...(progress?.daily || {}) },
  };
  const stars = starsFor(correct, total);
  const prev = p.units[unitId]?.stars ?? 0;
  p.units[unitId] = { correct, total, stars, done: lessonComplete(correct, total), updatedAt: now };
  if (stars > prev) p.stars += stars - prev;
  return p;
}

// Record one answered item for spaced repetition; returns new boxes map.
export function recordReviewItem(boxes, itemId, correct, now = Date.now()) {
  return { ...(boxes || {}), [itemId]: recordAnswer((boxes || {})[itemId], correct, now) };
}

// Daily usage: add ms to today (resets on date change). Pure.
export function addDailyTime(daily, ms, now = Date.now()) {
  const key = todayKey(now);
  if (!daily || daily.date !== key) return { date: key, ms: Math.max(0, ms) };
  return { date: key, ms: (daily.ms ?? 0) + Math.max(0, ms) };
}

export function isLimitReached(daily, now = Date.now(), limitMs = DEFAULT_DAILY_LIMIT_MS) {
  if (!daily || daily.date !== todayKey(now)) return false;
  return (daily.ms ?? 0) >= limitMs;
}

// Next unit unlocked when the previous one is complete (80%+).
export function unlockedUnits(unitIds, progress) {
  const units = progress?.units || {};
  const out = [];
  for (let i = 0; i < unitIds.length; i++) {
    if (i === 0) {
      out.push(unitIds[i]);
      continue;
    }
    if (units[unitIds[i - 1]]?.done) out.push(unitIds[i]);
    else break;
  }
  return out;
}
