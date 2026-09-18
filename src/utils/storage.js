import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PROFILE: '@abqarino/profile',
  PROGRESS: '@abqarino/progress',
};

const DEFAULT_PROGRESS = { stars: 0, byTopic: {}, sessions: 0 };

export const storage = {
  async saveProfile(profile) {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },
  async getProfile() {
    const raw = await AsyncStorage.getItem(KEYS.PROFILE);
    return raw ? JSON.parse(raw) : null;
  },
  async clearProfile() {
    await AsyncStorage.removeItem(KEYS.PROFILE);
  },

  async getProgress() {
    const raw = await AsyncStorage.getItem(KEYS.PROGRESS);
    return raw ? { ...DEFAULT_PROGRESS, ...JSON.parse(raw) } : { ...DEFAULT_PROGRESS };
  },
  async saveProgress(progress) {
    await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
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
};
