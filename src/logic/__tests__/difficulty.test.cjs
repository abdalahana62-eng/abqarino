const { test } = require('node:test');
const assert = require('node:assert/strict');
const d = require('../difficulty.js');

test('rounds and choices by age', () => {
  assert.equal(d.roundsForAge(3), 6);
  assert.equal(d.roundsForAge(5), 6);
  assert.equal(d.roundsForAge(6), 8);
  assert.equal(d.roundsForAge(10), 8);
  assert.equal(d.choicesForAge(3), 2);
  assert.equal(d.choicesForAge(5), 3);
  assert.equal(d.choicesForAge(7), 4);
  assert.equal(d.choicesForAge(9), 4);
  assert.equal(d.ageMinOf('3-4'), 3);
  assert.equal(d.ageMinOf('unknown'), 4);
});

test('3 wrong in a row steps down and flags easy question', () => {
  let s = { level: 0, wrongStreak: 0, correctStreak: 0 };
  s = d.adapt(s, { correct: false });
  s = d.adapt(s, { correct: false });
  assert.equal(s.easyNext, false);
  s = d.adapt(s, { correct: false });
  assert.equal(s.easyNext, true);
  assert.equal(s.level, -1);
});

test('5 fast correct in a row steps up (max +2)', () => {
  let s = { level: 0, wrongStreak: 0, correctStreak: 0 };
  for (let i = 0; i < 5; i++) s = d.adapt(s, { correct: true, fast: true });
  assert.equal(s.level, 1);
  for (let i = 0; i < 10; i++) s = d.adapt(s, { correct: true, fast: true });
  assert.ok(s.level <= 2);
});

test('slow correct streaks do not step up', () => {
  let s = { level: 0, wrongStreak: 0, correctStreak: 0 };
  for (let i = 0; i < 9; i++) s = d.adapt(s, { correct: true, fast: false });
  assert.equal(s.level, 0);
});

test('stars thresholds 60/80/95 and 80% completion', () => {
  assert.equal(d.starsFor(6, 10), 1);
  assert.equal(d.starsFor(8, 10), 2);
  assert.equal(d.starsFor(10, 10), 3);
  assert.equal(d.starsFor(5, 10), 0);
  assert.equal(d.starsFor(0, 0), 0);
  assert.equal(d.lessonComplete(8, 10), true);
  assert.equal(d.lessonComplete(4, 6), false);
  assert.equal(d.lessonComplete(5, 6), true);
});

test('shiftBounds shrinks ranges with level', () => {
  assert.deepEqual(d.shiftBounds(1, 20, 0), { min: 1, max: 20 });
  const down = d.shiftBounds(1, 20, -1);
  assert.ok(down.max < 20 && down.min === 1);
  const up = d.shiftBounds(1, 20, 1);
  assert.ok(up.min > 1 && up.max === 20);
});
