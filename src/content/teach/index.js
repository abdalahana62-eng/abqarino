// Teaching-scene loader: units/topics → ordered scenes.
// App-side module (Metro); pure mapping, no side effects.
import age3 from './math/age3.json';
import age4 from './math/age4.json';
import age5 from './math/age5.json';
import age6 from './math/age6.json';
import age7 from './math/age7.json';
import age8 from './math/age8.json';
import age9 from './math/age9.json';
import age10 from './math/age10.json';
import wordCats from './words/categories.json';
import { MATH_UNITS } from '../math/units';

const GROUP_AGES = { '3-4': [3, 4], '5-6': [5, 6], '7-8': [7, 8], '9-10': [9, 10] };
const BY_AGE = { 3: age3, 4: age4, 5: age5, 6: age6, 7: age7, 8: age8, 9: age9, 10: age10 };

// All scenes (in unit order) for a math topic within an age group.
export function mathScenesForTopic(topic, ageGroupId) {
  const ages = GROUP_AGES[ageGroupId] || [4];
  const units = MATH_UNITS.filter((u) => u.supported && u.topic === topic && ages.includes(u.age));
  const out = [];
  for (const u of units) {
    const scenes = (BY_AGE[u.age] && BY_AGE[u.age][u.id]) || [];
    out.push(...scenes);
  }
  return out;
}

export function wordScenesForCategory(topic) {
  return wordCats[topic] || [];
}

export function unitIdsForScenes(scenes) {
  const ids = [];
  for (const s of scenes || []) {
    if (s.unit && !ids.includes(s.unit)) ids.push(s.unit);
  }
  return ids;
}
