import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, fam, space } from '../theme';
import { getAgeGroup } from '../data/ageGroups';
import { storage } from '../utils/storage';
import AppHeader from '../components/AppHeader';
import ScreenShell from '../components/ScreenShell';
import Explainer from '../components/teach/Explainer';
import { mathScenesForTopic, wordScenesForCategory, unitIdsForScenes } from '../content/teach/index';
import { IMAGES } from '../utils/images';

// Teach: full explanation BEFORE any question.
// Menu → Teach → Guided → Play. From Play ("اشرح تاني") → back to Play.
// First visit auto-plays; completed lessons show the skip option.
export default function TeachScreen({ route, navigation }) {
  const { subject, topic, profile, from } = route.params || {};
  const group = getAgeGroup(profile?.ageGroupId);
  const isWords = subject === 'words';

  const scenes = useMemo(() => {
    if (isWords) return wordScenesForCategory(topic);
    return mathScenesForTopic(topic, profile?.ageGroupId);
  }, [isWords, topic, profile]);

  const [allowSkip, setAllowSkip] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        const p = await storage.getProgress();
        const ids = unitIdsForScenes(scenes);
        const doneCount = ids.filter((id) => p.units?.[id]?.done).length;
        setAllowSkip(doneCount > 0);
      } catch {
        setAllowSkip(true);
      }
    })();
  }, [scenes]);

  const goNext = () => {
    if (from === 'play') {
      navigation.goBack();
    } else {
      navigation.replace('Guided', { subject, topic, profile });
    }
  };

  const [si, setSi] = React.useState(0);
  const onSceneDone = () => {
    if (si + 1 < scenes.length) setSi(si + 1);
    else goNext();
  };

  const meta = isWords
    ? { title: 'نتعلم كلمات', mascot: '🦉' }
    : { title: 'نتعلم حساب', mascot: '🦊' };

  return (
    <ScreenShell
      header={
        <AppHeader
          title={`📖 ${meta.title}`}
          subtitle={isWords ? 'اسمع وشوف الأول' : 'شوف الفكرة الأول'}
          mascot={meta.mascot}
          mascotImage={IMAGES.mascotOwl}
          showBack
          backTo={from === 'play' ? undefined : topic ? (isWords ? 'VocabMenu' : 'MathMenu') : 'Home'}
          backParams={{ profile }}
          navigation={navigation}
        />
      }
    >
      {scenes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTxt}>الشرح جاي قريب! نبدأ اللعب؟ 🎮</Text>
        </View>
      ) : (
        <Explainer
          key={`${topic}-${si}`}
          scene={scenes[si]}
          title={scenes.length > 1 ? `درس ${si + 1} من ${scenes.length}` : undefined}
          allowSkip={allowSkip}
          onDone={onSceneDone}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  empty: { padding: space.xl, alignItems: 'center' },
  emptyTxt: { fontSize: font.md, fontFamily: fam.round, color: colors.text, textAlign: 'center' },
  more: { fontSize: font.xs, fontFamily: fam.roundMedium, color: colors.muted, textAlign: 'center', marginTop: space.sm },
});
