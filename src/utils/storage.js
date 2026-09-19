import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PROFILE: '@abqarino/profile',
  PROGRESS: '@abqarino/progress',
};

const DEFAULT_PROGRESS = { stars: 0, byTopic: {}, sessions: 0, units: {}, boxes: {}, daily: null };

// In-memory fallback so the app keeps working even if device storage
// (e.g. browser localStorage) is unavailable or throws.
const memory = { profile: null, progress: null };

async function safeGet(key) {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return memory[key] ?? null;
  }
}

async function safeSet(key, value) {
  memory[key] = value;
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // ignore: memory fallback already updated
  }
}

async function safeRemove(key) {
  memory[key] = null;
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const storage = {
  async saveProfile(profile) {
    await safeSet(KEYS.PROFILE, JSON.stringify(profile));
  },
  async getProfile() {
    const raw = await safeGet(KEYS.PROFILE);
    return raw ? JSON.parse(raw) : null;
  },
  async clearProfile() {
    await safeRemove(KEYS.PROFILE);
  },

  async getProgress() {
    const raw = await safeGet(KEYS.PROGRESS);
    return raw ? { ...DEFAULT_PROGRESS, ...JSON.parse(raw) } : { ...DEFAULT_PROGRESS };
  },
  async saveProgress(progress) {
    await safeSet(KEYS.PROGRESS, JSON.stringify(progress));
  },
  async addStars(topicKey, amount) {
    const p = await this.getProgress();
    p.stars += amount;
    if (topicKey) {
      const t = p.byTopic[topicKey] || { correct: 0, wrong: 0 };
      if (amount > 0) t.correct += 1;
      else t.wrong += 1;
      p.byTopic[topicKey] = t;
    }
    await this.saveProgress(p);
    return p;
  },
  async bumpSession() {
    const p = await this.getProgress();
    p.sessions += 1;
    await this.saveProgress(p);
    return p;
  },

  // Learning-logic fields (units/boxes/daily). Stored inside the same
  // progress object; single profile assumed (see ASSUMPTIONS.md).
  async saveUnits(units) {
    const p = await this.getProgress();
    p.units = units || {};
    await this.saveProgress(p);
    return p;
  },
  async saveBoxes(boxes) {
    const p = await this.getProgress();
    p.boxes = boxes || {};
    await this.saveProgress(p);
    return p;
  },
  async saveDaily(daily) {
    const p = await this.getProgress();
    p.daily = daily || null;
    await this.saveProgress(p);
    return p;
  },
};
