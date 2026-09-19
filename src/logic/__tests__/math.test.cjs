const { test } = require('node:test');
const assert = require('node:assert/strict');
const math = require('../../data/math.js');

const GROUPS = [
  { maxNum: 10, ageGroupId: '3-4' },
  { maxNum: 20, ageGroupId: '5-6' },
  { maxNum: 100, ageGroupId: '7-8' },
  { maxNum: 200, ageGroupId: '9-10' },
];
const TOPICS = ['counting', 'addition', 'subtraction', 'multiplication', 'division',
  'fractions', 'compare', 'nextnum', 'missing', 'shapes', 'patterns', 'evenodd', 'wordProblems'];

test('every topic: answer inside choices, unique, no negatives under 9', () => {
  for (const g of GROUPS) {
    for (const t of TOPICS) {
      for (let i = 0; i < 5; i++) {
        const q = math.generateMathQuestion(t, g);
        assert.ok(q.choices.map(String).includes(String(q.answer)), `${t} answer missing`);
        assert.equal(new Set(q.choices.map(String)).size, q.choices.length, `${t} dup choices`);
        if (typeof q.answer === 'number' && g.ageGroupId !== '9-10') {
          assert.ok(q.answer >= 0, `${t} negative answer`);
          for (const c of q.choices) {
            if (typeof c === 'number') assert.ok(c >= 0, `${t} negative choice`);
          }
        }
      }
    }
  }
});

test('choice counts by age: 2 / 3 / 4', () => {
  const counts = {};
  for (const g of GROUPS) {
    const q = math.generateMathQuestion('addition', g);
    counts[g.ageGroupId] = q.choices.length;
  }
  assert.deepEqual(counts, { '3-4': 2, '5-6': 3, '7-8': 4, '9-10': 4 });
});

test('subtraction never negative, division always exact', () => {
  for (let i = 0; i < 100; i++) {
    const s = math.generateMathQuestion('subtraction', { maxNum: 50 });
    assert.ok(s.answer >= 0);
    const d = math.generateMathQuestion('division', { maxNum: 100 });
    assert.equal(d.parts.a, d.parts.b * d.parts.ans);
  }
});

test('seeded runs are stable', () => {
  const g = { maxNum: 20, ageGroupId: '5-6' };
  const a = math.generateMathQuestion('addition', g, { rng: math.createRng(42) });
  const b = math.generateMathQuestion('addition', g, { rng: math.createRng(42) });
  assert.deepEqual(a, b);
});

test('unit tables only reference implemented generator topics', () => {
  const { MATH_UNITS } = require('../../content/math/units.js');
  const known = new Set(TOPICS);
  for (const u of MATH_UNITS.filter((x) => x.supported)) {
    assert.ok(known.has(u.topic), `unsupported topic referenced: ${u.topic}`);
  }
  assert.ok(MATH_UNITS.length >= 40);
});
