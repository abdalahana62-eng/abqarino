# CODEBASE_MAP — عبقرينو الصغير (abqarino)

> قراءة فقط بتاريخ 2026-09-19. لا يصف أي تعديل، فقط الوضع الحالي.

## 1. الشاشات ووظيفة كل واحدة

| الشاشة | الملف | الوظيفة |
|---|---|---|
| Splash | `src/screens/SplashScreen.js` | شاشة ترحيب (صورة الولد). بعد ~1.6 ثانية: لو فيه بروفايل محفوظ → Home، وإلا → ParentGate |
| ParentGate | `src/screens/ParentGateScreen.js` | الأهل يدخلوا اسم الطفل (اختياري) ويختاروا فئة عمرية من 4 كروت → حفظ البروفايل → Home |
| Home | `src/screens/HomeScreen.js` | تحية + بانر تحدي + كارتين (الحساب/الكلمات) + بانر فوز + شريط سفلي (رئيسية/حساب/كلمات/إعدادات الأهل التي تمسح البروفايل) |
| MathMenu | `src/screens/MathMenuScreen.js` | قائمة مواضيع الحساب الخاصة بالفئة العمرية (من `group.mathTopics`) |
| MathPlay | `src/screens/MathPlayScreen.js` | طوران: `lesson` (درس تفاعلي بمثال ثابت عبر `DragCountGame`) ثم `quiz` (جولة 8 أسئلة). الغلط → لعبة تعليم نفس المسألة (`teachSteps`) أو شرح شفهي للأرقام الكبيرة |
| VocabMenu | `src/screens/VocabMenuScreen.js` | قائمة مواضيع الكلمات الخاصة بالفئة العمرية (من `group.vocabTopics`) |
| VocabPlay | `src/screens/VocabPlayScreen.js` | وضعان: `quiz` (صورة كبيرة + 4 اختيارات نص+إيموجي، عربي/إنجليزي) و`speak` (قول ورايا: سماع الكلمة → نطق في المايك عبر Web Speech API أو تأكيد الأهل) |

التنقل: `src/navigation/RootNavigator.js` — Stack (`Splash → ParentGate → Home → MathMenu/MathPlay/VocabMenu/VocabPlay`) بدون هيدر (headerShown: false).

## 2. السن والمحتوى: الحفظ والاختيار

- البروفايل: `{ name, ageGroupId, createdAt }` في AsyncStorage مفتاح `@abqarino/profile` (مع fallback في الذاكرة) — `src/utils/storage.js`.
- الفئات في `src/data/ageGroups.js`: أربع فئات فقط `3-4 / 5-6 / 7-8 / 9-10`، كل فئة: `label/emoji/color/soft/description/mathTopics[]/vocabTopics[]/maxNum`.
- عناوين المواضيع في `MATH_TOPIC_META` و`VOCAB_TOPIC_META` (label/emoji/color).
- `getAgeGroup(id)` ترجع أول فئة كافتراضي لو المعرف مفقود.
- الاختيار يتم في القوائم: `group.mathTopics.map(...)` و`group.vocabTopics.map(...)` — أي موضوع جديد يُضاف للمصفوفات يظهر تلقائيًا.

## 3. تخزين المحتوى وشكله الحالي

- `src/data/math.js`: `generateMathQuestion(topic, ageGroup)` — توليد برمجي (مواضيع: counting/addition/subtraction/multiplication/division/fractions/wordProblems). شكل السؤال:
  `{ topic, question, speak, answer, choices[], visual: {type:'emojis',emoji,count} | {type:'fraction',numerator,denominator} | null, parts: {a,b,ans} | {n,ans} | {num,den,ans} }`.
  الاختيارات دائمًا 4 (`numberChoices`/`fractionChoices`)، من `shuffle` في `vocab.js`.
- `src/data/vocab.js`: قواميس `VOCAB = { colors(12), animals(30), family(7), food(16), body(12), school(12), nature(14), verbs(12), sentences(12), clothes(10), transport(10), jobs(10), feelings(10) }` — العنصر `{ar, en, emoji}`. ملاحظة: `food` فيه `Orange2` لتفادي تكرار مفتاح `Orange`.
- أسئلة الكلمات تُبنى داخل `VocabPlayScreen.next`: هدف عشوائي + 3 مشتتات من نفس الموضوع.

## 4. عرض السؤال والاختيارات (Props/بيانات)

- `MathPlayScreen`: يستقبل `route.params {profile, topic}`. يعرض `q.question` نصًا + `q.visual` (شبكة إيموجي أو شريط كسور) + `q.choices` (أزرار 2×2، تلوين أخضر/أحمر بعد الاختيار). ثابت `ROUND = 8`.
- `VocabPlayScreen`: يستقبل `{profile, topic}`. وضع quiz: إيموجي الهدف كبير + 4 اختيارات (إيموجي فوق الاسم). `ROUND = 8`.
- `DragCountGame` (`src/components/DragCountGame.js`): يستقبل `steps=[{mode:'collect'|'remove'|'count', n/show/take/limit/base/theme/hint/badge/say}]` + كولباك `onCount/onStep/onDone/onSkip`. السحب بـ PanResponder.
- المكونات العرضية الأخرى: `TopicCard` (emoji/label/title/color/soft/onPress/selected)، `WaveCard` (bg/children/onPress)، `Mascot` (emoji/size/colors)، `BigButton`، `BackButton`، `AppHeader`، `ScreenShell` (bg/header/scrollEnabled).

## 5. الصوت الحالي

- `src/utils/speech.js` (موبايل: expo-speech + expo-haptics) و`src/utils/speech.web.js` (Web SpeechSynthesis + navigator.vibrate) — نفس الواجهة: `speakAr/speakEn/speakSequence/teacher/stopSpeech/tap/haptics`. الصوت: `ar-EG` بمعدل 0.88 وpitch دافئ، والإنجليزي منفصل بعد العربي.
- `src/utils/voice.js` (يعمل على المنصتين عبر expo-av): طبقة موحدة — مقاطع Gemini الجاهزة من `assets/audio/*.wav` (خريطة مولدة في `src/utils/voiceClips.js`) أولًا، وTTS الجهاز كبديل لأي مقطع ناقص. دوال: `playKey/playSeq/stopVoice/keys/questionKeys/explainKeys/teachSteps/vocabKeys/C/CN`.
- `src/utils/speechRec.js`: التعرف على النطق (Web SpeechRecognition، إنجليزي) + fallback.
- المقاطع الموجودة (28): greet/praise1-4/encourage1-3/ask1-3/reveal/teach_intro/t_put/t_inmind/t_takeout/t_fingers/t_countafter/t_startfrom/t_countupto + n0-n7,n9.

## 6. الموجود vs المطلوب (تغطية أولية)

- موجود: توليد مسائل برمجي، اختيارات قريبة من الإجابة، طرح بلا سوالب (b<a دائمًا)، قسمة بلا باقي (a=b*ans)، مسائل كلامية قصيرة، نجوم وsessions في `storage`، تشجيع بلا كلمة "غلط"، أصوات عربي-ثم-إنجليزي، وضع نطق.
- مش موجود: وحدات مرتبة لكل سن منفرد (3..10)، عدد اختيارات حسب السن (ثابت 4)، عدد أسئلة حسب السن (ثابت 8)، تفاعل إدخال رقم، فتح الدروس بالتقدم (80%)، Leitner، حد يومي، شاشة مراجعة، `level_offset` للأهل، مراحل الكلمة (ترتيب حروف/كتابة)، تشكيل عربي، `phrases.json`، اختبارات، `REPORT.md`.

## ملحق وضع المعلم (teacher-mode) — 2026-09-19

### (أ) مسار الدرس الحالي: اختيار → أسئلة
- `MathMenu` يعرض `group.mathTopics` (بيانات) وينتقل `navigation.navigate('MathPlay', {profile, topic})`.
- `MathPlay` طوران داخليان: `lesson` (لعبة سحب تجريبية بمثال ثابت `DEMO`) ثم `quiz` (8/6 أسئلة من `generateMathQuestion`)؛ الغلط يفتح `teachSteps` أو شرحًا شفهيًا.
- `VocabMenu` → `VocabPlay` بنفس النمط (`{profile, topic}`)، وضعا `quiz` و`speak`.
- أي خطوة شرح جديدة ستُحقن هنا: `Menu → Teach → Play` مع زر "اشرح تاني" داخل `Play` — دون مساس بشكل الشاشات.

### (ب) قيم الثيم لشاشات الشرح (من `src/theme.js` — تُستخدم كما هي)
- الألوان: `bg #F4EFFF`، `primary #7B61FF`، `purple #8B7CFF`، `purpleSoft #DCCBFF`، `yellowSoft #FFE9A8`، `pinkSoft #FFD3E3`، `blueSoft #CDE7FF`، `text #221C46`، `muted #7A7390`، `success #22C55E`، `error #DC2626`، `cardBg #FFFFFF`، `cardBorder #E7DEFF`.
- الخطوط: `round Cairo_900Black` (عناوين)، `roundBold BalooBhaijaan2_800ExtraBold`، `roundMedium Cairo_700Bold`.
- المقاسات: `font {xs:14, sm:18, md:24, lg:32, xl:44, xxl:60}`، `space {xs:4, sm:8, md:16, lg:24, xl:32, xxl:48}`، `radius {sm:8, md:16, lg:24, xl:40, round:999}`.
- الأسلوب: كروت باستيل بزاوية 28، ظل موف خفيف، أزرار دائرية داكنة `#221C46`، إيموجي كبير — تُبنى شاشات الشرح من نفس المفردات.

### (ج) الصوت واكتماله
- موبايل: `expo-speech` يدعم `onDone/onStopped/onError` (مُستخدم فعلًا في `speech.js` `speakSequence`) — المحرك سيستخدم `onDone` لانتظار نهاية الجملة.
- ويب: `speech.web.js` يستخدم `SpeechSynthesisUtterance.onend` — نفس الضمان.
- `voice.js`: `playKey` يُنتظر فعليًا (Promise يتحقق عند `didJustFinish`) + بديل مؤقّت 12 ثانية؛ الأرقام تُنطق بمقاطع أو TTS احتياطي.
- القاعدة: أي صوت يفشل → النص يبقى معروضًا والتسلسل يكمل (try/catch + resolve).
