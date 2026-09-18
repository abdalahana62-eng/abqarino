import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

export function speakAr(text) {
  Speech.stop();
  Speech.speak(text, { language: 'ar-EG', rate: 0.9, pitch: 1.05 });
}

export function speakEn(text) {
  Speech.stop();
  Speech.speak(text, { language: 'en-US', rate: 0.85, pitch: 1.05 });
}

export function stopSpeech() {
  Speech.stop();
}

export function tap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
export function hapticError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
