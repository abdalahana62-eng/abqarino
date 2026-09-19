const { test } = require('node:test');
const assert = require('node:assert/strict');
const tr = require('../teachRunner.js');
const { MATH_UNITS } = require('../../content/math/units.js');
const { VOCAB_TOPIC_META } = require('../../data/ageGroups.js');

function allMathScenes() {
  const out = [];
  for (const f of ['age3', 'age4', 'age5', 'age6', 'age7', 'age8', 'age9', 'age10']) {
    const data = require('../../content/teach/math/' + f + '.json');
    for (const [unit, list] of Object.entries(data)) {
      for (const s of list) out.push({ file: f, unit, scene: s });
    }
  }
  return out;
}

test('runner executes every step in order (mock player)', async () => {
  const data = require('../../content/teach/math/age5.json');
  const scene = data.a5_add_5[0];
  const seen = [];
  const player = {};
  for (const t of tr.STEP_TYPES) {
    player[t] = async () => {
      seen.push(t);
    };
  }
  const log = await tr.runSceneSteps(scene, player);
  assert.deepEqual(log, seen);
  assert.ok(log.includes('say') && log.includes('equation') && log.includes('ask'));
});

test('runner rejects invalid scenes and unknown steps', async () => {
  await assert.rejects(tr.runSceneSteps({ id: 'x', steps: [] }, {}));
  await assert.rejects(
    tr.runSceneSteps({ id: 'x', steps: [{ t: 'say' }] }, { say: async () => {} }),
    /say needs ar/
  );
});

test('equation evaluator checks arithmetic', () => {
  const ok = (parts) => tr.evalEquation(parts).ok;
  assert.equal(ok([{ t: 'num', v: 2 }, { t: 'op', v: '+' }, { t: 'num', v: 1 }, { t: 'eq' }, { t: 'num', v: 3 }]), true);
  assert.equal(ok([{ t: 'num', v: 3 }, { t: 'op', v: '-' }, { t: 'num', v: 1 }, { t: 'eq' }, { t: 'num', v: 2 }]), true);
  assert.equal(ok([{ t: 'num', v: 2 }, { t: 'op', v: '+' }, { t: 'num', v: 1 }, { t: 'eq' }, { t: 'num', v: 4 }]), false);
  assert.equal(ok([{ t: 'num', v: 5 }, { t: 'op', v: '÷' }, { t: 'num', v: 0 }, { t: 'eq' }, { t: 'num', v: 0 }]), false);
});

test('coverage: every supported math unit has >=1 valid scene', () => {
  const scenes = allMathScenes();
  assert.ok(scenes.length >= 50, `expected 50+ scenes, got ${scenes.length}`);
  const missing = [];
  for (const u of MATH_UNITS.filter((x) => x.supported)) {
    if (!scenes.some((s) => s.unit === u.id)) missing.push(u.id);
  }
  console.log('missing math scenes: ' + (missing.length ? missing.join(', ') : 'none'));
  assert.deepEqual(missing, []);
  const errs = [];
  for (const s of scenes) {
    tr.validateScene(s.scene).forEach((e) => errs.push(s.scene.id + ': ' + e));
  }
  assert.deepEqual(errs, []);
});

test('coverage: every vocab topic has a word scene', () => {
  const cats = require('../../content/teach/words/categories.json');
  const missing = Object.keys(VOCAB_TOPIC_META).filter((t) => !(cats[t] && cats[t].length));
  console.log('missing word scenes: ' + (missing.length ? missing.join(', ') : 'none'));
  assert.deepEqual(missing, []);
  const errs = [];
  for (const [cat, list] of Object.entries(cats)) {
    for (const s of list) tr.validateScene(s).forEach((e) => errs.push(cat + '/' + s.id + ': ' + e));
  }
  assert.deepEqual(errs, []);
});
