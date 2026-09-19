const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sr = require('../spacedRepetition.js');
const pg = require('../progress.js');

const DAY = 24 * 60 * 60 * 1000;

test('leitner: correct advances box, wrong returns to box 1', () => {
  const t0 = 1_700_000_000_000;
  let r = sr.recordAnswer(undefined, true, t0);
  assert.equal(r.box, 2);
  r = sr.recordAnswer(r, true, t0);
  assert.equal(r.box, 3);
  r = sr.recordAnswer(r, false, t0);
  assert.equal(r.box, 1);
});

test('leitner intervals: 1/3/7/14/30 days and cap at box 5', () => {
  const t0 = 1_700_000_000_000;
  let r = { box: 4 };
  r = sr.recordAnswer(r, true, t0);
  assert.equal(r.box, 5);
  assert.equal(r.dueAt - t0, 30 * DAY);
  r = sr.recordAnswer(r, true, t0);
  assert.equal(r.box, 5);
  const r1 = sr.recordAnswer(undefined, true, t0);
  assert.equal(r1.dueAt - t0, 3 * DAY || 1 * DAY);
});

test('getDueItems: only due, lowest box first, 3-5 items', () => {
  const t0 = 1_700_000_000_000;
  const boxes = {
    a: { box: 3, dueAt: t0 - 1 },
    b: { box: 1, dueAt: t0 - 1 },
    c: { box: 2, dueAt: t0 + DAY },
    d: { box: 1, dueAt: t0 - 1 },
    e: { box: 5, dueAt: t0 - 1 },
    f: { box: 2, dueAt: t0 - 1 },
    g: { box: 4, dueAt: t0 - 1 },
  };
  const due = sr.getDueItems(boxes, t0, 5);
  assert.ok(!due.includes('c'), 'future item must not be due');
  assert.ok(due.length >= 3 && due.length <= 5);
  assert.deepEqual(due.slice(0, 2), ['b', 'd']);
});

test('recordLesson: stars only grow, no mutation, completion flag', () => {
  const before = { stars: 2, byTopic: {}, units: {}, boxes: {}, daily: null };
  const snap = JSON.parse(JSON.stringify(before));
  const after = pg.recordLesson(before, 'a3_count_3', 8, 10);
  assert.deepEqual(before, snap);
  assert.equal(after.units.a3_count_3.stars, 2);
  assert.equal(after.units.a3_count_3.done, true);
  assert.equal(after.stars, 4);
  const replay = pg.recordLesson(after, 'a3_count_3', 6, 10);
  assert.equal(replay.stars, 4, 'replaying worse must not add stars');
  assert.equal(replay.units.a3_count_3.done, false);
});

test('daily time resets on date change; limit defaults to 15 min', () => {
  const t0 = new Date(2026, 8, 19, 10, 0, 0).getTime();
  let d = pg.addDailyTime(null, 5 * 60 * 1000, t0);
  assert.equal(pg.isLimitReached(d, t0), false);
  d = pg.addDailyTime(d, 11 * 60 * 1000, t0);
  assert.equal(pg.isLimitReached(d, t0), true);
  const next = pg.addDailyTime(d, 1000, t0 + DAY);
  assert.equal(next.ms, 1000);
  assert.equal(pg.isLimitReached(next, t0 + DAY), false);
});

test('unlockedUnits opens the chain one by one', () => {
  const ids = ['u1', 'u2', 'u3'];
  assert.deepEqual(pg.unlockedUnits(ids, {}), ['u1']);
  const p = { units: { u1: { done: true } } };
  assert.deepEqual(pg.unlockedUnits(ids, p), ['u1', 'u2']);
});

test('no forbidden words in shipped user-facing strings', () => {
  const banned = ['غلط', 'خطأ', 'فشلت', 'للأسف'];
  const roots = ['src/data', 'src/content', 'src/logic', 'src/utils'];
  const hits = [];
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) {
        if (f.name === '__tests__') continue;
        walk(p);
      } else if (/\.js$/.test(f.name) || /\.json$/.test(f.name)) {
        const text = fs.readFileSync(p, 'utf8');
        for (const w of banned) {
          if (text.includes(w)) hits.push(`${p}: ${w}`);
        }
      }
    }
  };
  roots.forEach(walk);
  assert.deepEqual(hits, []);
});
