const { test } = require('node:test');
const assert = require('node:assert/strict');
const wq = require('../wordQuestions.js');
const meta = require('../../content/words/meta.js');
const { VOCAB } = require('../../data/vocab.js');

test('options: target present, exact count, same-category pool', () => {
  for (const [topic, pool] of Object.entries(VOCAB)) {
    const target = pool[0];
    const opts = wq.buildWordOptions(pool, target.en, { count: 4, lang: 'ar' });
    assert.equal(opts.length, 4);
    assert.ok(opts.some((o) => o.key === target.en));
    for (const o of opts) {
      assert.ok(o.text && o.emoji, 'option needs text+emoji');
      assert.ok(pool.some((p) => p.en === o.key), 'option must come from same pool');
    }
  }
});

test('wrongs prefer a different first letter (cow <- horse, not calf)', () => {
  let sameHead = 0;
  for (let i = 0; i < 60; i++) {
    const opts = wq.buildWordOptions(VOCAB.animals, 'Cow', { count: 4, lang: 'ar' });
    for (const o of opts) {
      if (o.key !== 'Cow' && o.text.charAt(0) === 'ب') sameHead++;
    }
  }
  assert.ok(sameHead < 60, `too many same-head distractors: ${sameHead}`);
});

test('english options use english text', () => {
  const opts = wq.buildWordOptions(VOCAB.animals, 'Cat', { count: 3, lang: 'en' });
  assert.ok(opts.find((o) => o.key === 'Cat').text === 'Cat');
});

test('word metadata: min_age known, display diacritized at <=7', () => {
  assert.equal(meta.minAgeOf('Cat'), 3);
  assert.equal(meta.minAgeOf('Saturday'), 8);
  assert.equal(meta.wordDisplay({ ar: 'بقرة', en: 'Cow' }, 5, 'ar'), 'بَقَرَة');
  assert.equal(meta.wordDisplay({ ar: 'بقرة', en: 'Cow' }, 9, 'ar'), 'بقرة');
  assert.equal(meta.wordDisplay({ ar: 'بقرة', en: 'Cow' }, 5, 'en'), 'Cow');
});

test('every vocab item has ar/en/emoji and unique en per topic', () => {
  let total = 0;
  for (const [topic, pool] of Object.entries(VOCAB)) {
    assert.ok(pool.length >= 4, `${topic} too small`);
    const keys = new Set();
    for (const w of pool) {
      assert.ok(w.ar && w.en && w.emoji, `${topic} item missing field: ${JSON.stringify(w)}`);
      assert.ok(!keys.has(w.en), `${topic} duplicate en: ${w.en}`);
      keys.add(w.en);
      total++;
    }
  }
  assert.ok(total >= 150, `expected 150+ words, got ${total}`);
});
