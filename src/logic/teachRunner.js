// Pure teaching-engine core: scene validation + headless step runner.
// No imports, no side effects — fully testable under node.
// Audio-backed playback lives in ./audio.js and components/teach/*.

export const STEP_TYPES = [
  'say', 'showObjects', 'count', 'showNumeral', 'move', 'takeAway',
  'equation', 'numberLine', 'blocks', 'groups', 'fraction', 'ask', 'pause',
  'wordCard',
];

const BANNED = ['غلط', 'خطأ', 'فشلت', 'للأسف'];

function hasBanned(s) {
  return typeof s === 'string' && BANNED.some((w) => s.includes(w));
}

// Evaluate a simple equation parts array: [{t:'num',v}, {t:'op',v:'+'|'-'|'×'|'÷'}, ..., {t:'eq'}, {t:'num',v}]
// Returns { value, ok } where ok means left side equals the stated answer.
export function evalEquation(parts) {
  try {
    const nums = [];
    const ops = [];
    let answer = null;
    let seenEq = false;
    for (const p of parts || []) {
      if (p.t === 'num') {
        if (!seenEq) nums.push(Number(p.v));
        else answer = Number(p.v);
      } else if (p.t === 'op') ops.push(p.v);
      else if (p.t === 'eq') seenEq = true;
    }
    if (!nums.length || answer === null || nums.length !== ops.length + 1) {
      return { value: null, ok: false };
    }
    let value = nums[0];
    for (let i = 0; i < ops.length; i++) {
      const b = nums[i + 1];
      if (ops[i] === '+') value += b;
      else if (ops[i] === '-') value -= b;
      else if (ops[i] === '×' || ops[i] === '*') value *= b;
      else if (ops[i] === '÷' || ops[i] === '/') {
        if (b === 0) return { value: null, ok: false };
        value /= b;
      } else return { value: null, ok: false };
    }
    return { value, ok: Math.abs(value - answer) < 1e-9 };
  } catch {
    return { value: null, ok: false };
  }
}

export function validateScene(scene) {
  const errors = [];
  if (!scene || typeof scene !== 'object') return ['scene must be an object'];
  if (!scene.id || typeof scene.id !== 'string') errors.push('missing id');
  if (!Array.isArray(scene.steps) || !scene.steps.length) {
    errors.push('steps must be a non-empty array');
    return errors;
  }
  scene.steps.forEach((s, i) => {
    const at = `step ${i}`;
    if (!s || typeof s !== 'object') {
      errors.push(`${at} must be an object`);
      return;
    }
    if (!STEP_TYPES.includes(s.t)) {
      errors.push(`${at} unknown type ${s.t}`);
      return;
    }
    for (const k of ['ar', 'en', 'caption']) {
      if (hasBanned(s[k])) errors.push(`${at} banned word in ${k}`);
    }
    if (s.t === 'say' && !s.ar) errors.push(`${at} say needs ar`);
    if (s.t === 'showObjects' && !(Number.isInteger(s.n) && s.n >= 1)) {
      errors.push(`${at} showObjects needs n>=1`);
    }
    if (s.t === 'count' && !(Number.isInteger(s.n) && s.n >= 1)) {
      errors.push(`${at} count needs n>=1`);
    }
    if (s.t === 'showNumeral' && !s.text) errors.push(`${at} showNumeral needs text`);
    if (s.t === 'equation') {
      if (!Array.isArray(s.parts) || !s.parts.length) errors.push(`${at} equation needs parts`);
      else {
        const r = evalEquation(s.parts);
        if (!r.ok) errors.push(`${at} equation is wrong (${JSON.stringify(s.parts)})`);
      }
    }
    if (s.t === 'ask') {
      if (!Array.isArray(s.options) || s.options.length < 2) errors.push(`${at} ask needs 2+ options`);
      if (!s.answer) errors.push(`${at} ask needs answer`);
    }
    if (s.t === 'wordCard' && !(s.emoji && s.ar && s.en)) {
      errors.push(`${at} wordCard needs emoji+ar+en`);
    }
    if (s.t === 'fraction' && !(s.den >= 2 && s.num >= 0 && s.num <= s.den)) {
      errors.push(`${at} fraction needs 0<=num<=den, den>=2`);
    }
  });
  return errors;
}

// Headless runner: walks steps calling player[t](step, ctx). Used by tests
// (mock player) and mirrors what Explainer does on screen.
export async function runSceneSteps(scene, player, ctx = {}) {
  const errors = validateScene(scene);
  if (errors.length) throw new Error(`invalid scene: ${errors.join('; ')}`);
  const log = [];
  for (let i = 0; i < scene.steps.length; i++) {
    const s = scene.steps[i];
    const fn = player[s.t];
    if (typeof fn !== 'function') throw new Error(`no player for step type ${s.t}`);
    await fn(s, { ...ctx, index: i });
    log.push(s.t);
  }
  return log;
}

export function waitMs(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
