// Pure Leitner spaced-repetition (5 boxes).
// Intervals: box1 = 1 day, box2 = 3 days, box3 = 7 days, box4 = 14 days, box5 = 30 days.
// Correct → next box. Wrong → back to box 1. Pure, dependency-free, testable.
export const BOX_INTERVAL_DAYS = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
export const MAX_BOX = 5;
const DAY = 24 * 60 * 60 * 1000;

export function boxOf(record) {
  const b = record?.box ?? 1;
  return Math.min(MAX_BOX, Math.max(1, b));
}

export function recordAnswer(record, correct, now = Date.now()) {
  const box = correct ? Math.min(MAX_BOX, boxOf(record) + 1) : 1;
  return { box, dueAt: now + (BOX_INTERVAL_DAYS[box] ?? 30) * DAY, updatedAt: now };
}

export function isDue(record, now = Date.now()) {
  if (!record) return true;
  return (record.dueAt ?? 0) <= now;
}

// getDueItems(boxes, now, limit): 3-5 due items, lowest box first.
export function getDueItems(boxes, now = Date.now(), limit = 5) {
  const entries = Object.entries(boxes || {})
    .filter(([, r]) => isDue(r, now))
    .sort((a, b) => boxOf(a[1]) - boxOf(b[1]) || (a[1].dueAt ?? 0) - (b[1].dueAt ?? 0));
  return entries.slice(0, Math.max(3, Math.min(5, limit))).map(([id]) => id);
}
