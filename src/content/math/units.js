// Math curriculum: ordered units per single age (3..10).
// Rule: concrete (countable things) → symbols → abstract. One idea per unit.
// `topic` must match a generator topic in src/data/math.js.
// `supported: false` means the unit needs visuals/interactions the current
// components don't have yet (listed in REPORT.md under Needs UI decision).
export const MATH_UNITS = [
  // ---- Age 3 (numbers 1-5) ----
  { id: 'a3_count_3', age: 3, topic: 'counting', title: 'عدّ من 1 لـ 3', params: { minCount: 1, maxCount: 3 }, rounds: 6, choices: 2, supported: true },
  { id: 'a3_count_5', age: 3, topic: 'counting', title: 'عدّ 4 و5', params: { minCount: 4, maxCount: 5 }, rounds: 6, choices: 2, supported: true },
  { id: 'a3_one_many', age: 3, topic: 'compare', title: 'واحد وكتير', params: { min: 1, max: 5, mode: 'max' }, rounds: 6, choices: 2, supported: true },
  { id: 'a3_shapes', age: 3, topic: 'shapes', title: 'الأشكال: دايرة ومربع ومثلث', params: {}, rounds: 6, choices: 2, supported: true },
  { id: 'a3_big_small', age: 3, topic: 'compare', title: 'كبير وصغير', params: { min: 1, max: 5, mode: 'max' }, rounds: 6, choices: 2, supported: true },
  // ---- Age 4 (1-10) ----
  { id: 'a4_count_10', age: 4, topic: 'counting', title: 'عدّ حتى 10', params: { minCount: 1, maxCount: 10 }, rounds: 6, choices: 2, supported: true },
  { id: 'a4_num_qty', age: 4, topic: 'nextnum', title: 'ربط الرقم بالكمية', params: { min: 1, max: 9 }, rounds: 6, choices: 2, supported: true },
  { id: 'a4_more_less', age: 4, topic: 'compare', title: 'أكتر وأقل ومتساوي', params: { min: 1, max: 10, mode: 'both' }, rounds: 6, choices: 2, supported: true },
  { id: 'a4_plus_one', age: 4, topic: 'addition', title: 'زوّد واحد', params: { b: 1, max: 9 }, rounds: 6, choices: 2, supported: true },
  { id: 'a4_order', age: 4, topic: 'nextnum', title: 'ترتيب الأرقام 1-10', params: { min: 1, max: 9 }, rounds: 6, choices: 2, supported: true },
  { id: 'a4_patterns', age: 4, topic: 'patterns', title: 'أنماط بسيطة', params: {}, rounds: 6, choices: 2, supported: true },
  // ---- Age 5 (1-20) ----
  { id: 'a5_11_20', age: 5, topic: 'counting', title: 'الأعداد 11-20', params: { minCount: 11, maxCount: 15 }, rounds: 6, choices: 3, supported: true },
  { id: 'a5_before_after', age: 5, topic: 'nextnum', title: 'قبل وبعد الرقم', params: { min: 10, max: 19 }, rounds: 6, choices: 3, supported: true },
  { id: 'a5_add_5', age: 5, topic: 'addition', title: 'جمع لحد 5 بالصور', params: { max: 5 }, rounds: 6, choices: 3, supported: true },
  { id: 'a5_add_10', age: 5, topic: 'addition', title: 'جمع لحد 10', params: { max: 10 }, rounds: 6, choices: 3, supported: true },
  { id: 'a5_sub_5', age: 5, topic: 'subtraction', title: 'طرح لحد 5', params: { max: 5 }, rounds: 6, choices: 3, supported: true },
  { id: 'a5_sub_10', age: 5, topic: 'subtraction', title: 'طرح لحد 10', params: { max: 10 }, rounds: 6, choices: 3, supported: true },
  { id: 'a5_symbols', age: 5, topic: 'missing', title: 'ربط العملية بالرمز', params: { max: 10 }, rounds: 6, choices: 3, supported: true },
  // ---- Age 6 (to 20) ----
  { id: 'a6_add_20', age: 6, topic: 'addition', title: 'جمع لحد 20', params: { max: 20 }, rounds: 8, choices: 3, supported: true },
  { id: 'a6_sub_20', age: 6, topic: 'subtraction', title: 'طرح لحد 20', params: { max: 20 }, rounds: 8, choices: 3, supported: true },
  { id: 'a6_ten_pairs', age: 6, topic: 'missing', title: 'أزواج العشرة', params: { sum: 10 }, rounds: 8, choices: 3, supported: true },
  { id: 'a6_numberline', age: 6, topic: 'nextnum', title: 'خط الأعداد', params: { min: 5, max: 20 }, rounds: 8, choices: 3, supported: true },
  { id: 'a6_skip', age: 6, topic: 'patterns', title: 'عدّ بالقفز 2 و5 و10', params: { skip: true }, rounds: 8, choices: 3, supported: true },
  { id: 'a6_clock', age: 6, topic: 'clock', title: 'الساعة الكاملة', params: {}, rounds: 8, choices: 3, supported: false },
  { id: 'a6_compare', age: 6, topic: 'compare', title: 'مقارنة الأعداد', params: { min: 1, max: 20, mode: 'both' }, rounds: 8, choices: 3, supported: true },
  // ---- Age 7 (to 100) ----
  { id: 'a7_place', age: 7, topic: 'compare', title: 'الآحاد والعشرات', params: { min: 10, max: 99, mode: 'both' }, rounds: 8, choices: 4, supported: true },
  { id: 'a7_add_nocarry', age: 7, topic: 'addition', title: 'جمع بدون حمل', params: { max: 50, noCarry: true }, rounds: 8, choices: 4, supported: true },
  { id: 'a7_add_carry', age: 7, topic: 'addition', title: 'جمع بحمل', params: { max: 50 }, rounds: 8, choices: 4, supported: true },
  { id: 'a7_sub_noborrow', age: 7, topic: 'subtraction', title: 'طرح بدون استلاف', params: { max: 50, noBorrow: true }, rounds: 8, choices: 4, supported: true },
  { id: 'a7_sub_borrow', age: 7, topic: 'subtraction', title: 'طرح باستلاف', params: { max: 50 }, rounds: 8, choices: 4, supported: true },
  { id: 'a7_mult_rep', age: 7, topic: 'multiplication', title: 'ضرب كجمع متكرر', params: { maxTable: 5 }, rounds: 8, choices: 4, supported: true },
  { id: 'a7_evenodd', age: 7, topic: 'evenodd', title: 'زوجي وفردي', params: { max: 50 }, rounds: 8, choices: 2, supported: true },
  { id: 'a7_money', age: 7, topic: 'money', title: 'النقود (الجنيه)', params: {}, rounds: 8, choices: 4, supported: false },
  // ---- Age 8 (to 1000) ----
  { id: 'a8_big', age: 8, topic: 'compare', title: 'أعداد لحد 1000', params: { min: 100, max: 999, mode: 'both' }, rounds: 8, choices: 4, supported: true },
  { id: 'a8_addsub', age: 8, topic: 'addition', title: 'جمع وطرح بحمل واستلاف', params: { max: 200 }, rounds: 8, choices: 4, supported: true },
  { id: 'a8_tables', age: 8, topic: 'multiplication', title: 'جدول 2 و3 و4 و5 و10', params: { tables: [2, 3, 4, 5, 10] }, rounds: 8, choices: 4, supported: true },
  { id: 'a8_divshare', age: 8, topic: 'division', title: 'القسمة كتوزيع', params: { maxTable: 5 }, rounds: 8, choices: 4, supported: true },
  { id: 'a8_word1', age: 8, topic: 'wordProblems', title: 'مسائل كلامية بخطوة', params: { max: 30 }, rounds: 8, choices: 4, supported: true },
  { id: 'a8_time', age: 8, topic: 'clock', title: 'الوقت: ساعة ونص وربع', params: {}, rounds: 8, choices: 4, supported: false },
  // ---- Age 9 (to 10,000) ----
  { id: 'a9_big', age: 9, topic: 'compare', title: 'أعداد لحد 10,000', params: { min: 1000, max: 9999, mode: 'both' }, rounds: 8, choices: 4, supported: true },
  { id: 'a9_tables', age: 9, topic: 'multiplication', title: 'جدول 6 و7 و8 و9', params: { tables: [6, 7, 8, 9] }, rounds: 8, choices: 4, supported: true },
  { id: 'a9_divinv', age: 9, topic: 'division', title: 'القسمة كعكس الضرب', params: { maxTable: 9 }, rounds: 8, choices: 4, supported: true },
  { id: 'a9_mult2d', age: 9, topic: 'multiplication', title: 'ضرب عدد في رقمين (مدخل)', params: { twoDigit: true }, rounds: 8, choices: 4, supported: true },
  { id: 'a9_fractions', age: 9, topic: 'fractions', title: 'الكسور: نص وتلت وربع', params: {}, rounds: 8, choices: 4, supported: true },
  { id: 'a9_word2', age: 9, topic: 'wordProblems', title: 'مسائل بخطوتين', params: { max: 50, twoStep: true }, rounds: 8, choices: 4, supported: true },
  // ---- Age 10 ----
  { id: 'a10_fracmp', age: 10, topic: 'fractions', title: 'كسور: مقارنة وجمع بنفس المقام', params: { sameDenominator: true }, rounds: 8, choices: 4, supported: true },
  { id: 'a10_decimal', age: 10, topic: 'decimals', title: 'الأعداد العشرية (مدخل)', params: {}, rounds: 8, choices: 4, supported: false },
  { id: 'a10_bigmd', age: 10, topic: 'multiplication', title: 'ضرب وقسمة أعداد أكبر', params: { maxTable: 12 }, rounds: 8, choices: 4, supported: true },
  { id: 'a10_multistep', age: 10, topic: 'wordProblems', title: 'مسائل متعددة الخطوات', params: { max: 100, twoStep: true }, rounds: 8, choices: 4, supported: true },
  { id: 'a10_measure', age: 10, topic: 'measure', title: 'فلوس ووقت وقياس', params: {}, rounds: 8, choices: 4, supported: false },
  { id: 'a10_perimeter', age: 10, topic: 'geometry', title: 'المحيط ومساحة المستطيل', params: {}, rounds: 8, choices: 4, supported: false },
];

export function unitsForAge(age) {
  return MATH_UNITS.filter((u) => u.age === age);
}

export function supportedUnitsForAge(age) {
  return MATH_UNITS.filter((u) => u.age === age && u.supported);
}
