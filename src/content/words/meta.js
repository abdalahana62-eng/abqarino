// Word metadata: minimum age per word (spec §5 lists; older ages see younger
// words in review only) + display helper (diacritized Arabic for ages ≤ 7).
// Pure, dependency-free except the diacritics map.
import { AR_DIACRITIZED } from './diacritics.js';

const MIN_AGE = {
  // age 3
  Cat: 3, Dog: 3, Cow: 3, Duck: 3, Apple: 3, Banana: 3, Water: 3, Ball: 3,
  House: 3, Sun: 3, Moon: 3, Car: 3,
  // age 4
  Red: 4, Blue: 4, Green: 4, Yellow: 4, White: 4, Black: 4,
  Eye: 4, Nose: 4, Mouth: 4, Ear: 4, Hand: 4, Foot: 4,
  Mother: 4, Father: 4, Brother: 4, Sister: 4,
  // age 5
  Bread: 5, Milk: 5, Egg: 5, Cheese: 5,
  Shirt: 5, Shoe: 5, Hat: 5, Socks: 5,
  Plane: 5, Train: 5, Ship: 5, Bike: 5, Bus: 5,
  Lion: 5, Elephant: 5, Monkey: 5, Rabbit: 5, Fish: 5, Bird: 5,
  // age 6
  Book: 6, Pen: 6, Bag: 6, Ruler: 6, Board: 6,
  Tree: 6, Flower: 6, River: 6, Mountain: 6, Sea: 6, Sky: 6, Star: 6,
  Rain: 6, Cloud: 6, Wind: 6, Snow: 6,
  Door: 6, Window: 6, Bed: 6, Chair: 6, Table: 6, Lamp: 6,
  // age 7
  Doctor: 7, Teacher: 7, 'Police Officer': 7, Farmer: 7, Pilot: 7, Cook: 7,
  School: 7, Hospital: 7, Garden: 7, Market: 7, Restaurant: 7,
  Big: 7, Small: 7, Tall: 7, Short: 7, Hot: 7, Cold: 7, Fast: 7, Slow: 7,
  // age 8
  Saturday: 8, Sunday: 8, Monday: 8, Tuesday: 8, Wednesday: 8, Thursday: 8, Friday: 8,
  Eat: 8, Drink: 8, Run: 8, Jump: 8, Read: 8, Write: 8, Sleep: 8,
  Kitchen: 8, Bathroom: 8, Room: 8, Yard: 8,
  // age 9
  January: 9, February: 9, March: 9, April: 9, May: 9, June: 9,
  July: 9, August: 9, September: 9, October: 9, November: 9, December: 9,
  Farm: 9, City: 9, Village: 9, Library: 9,
  Open: 9, Close: 9, Help: 9, Play: 9,
  Happy: 9, Sad: 9, Angry: 9, Scared: 9,
  // age 10
  Earth: 10, Mars: 10, Planet: 10,
  Football: 10, Swimming: 10, Running: 10,
  Scissors: 10, Key: 10, Clock: 10,
  Go: 10, Went: 10, Ate: 10, Saw: 10,
};

export function minAgeOf(enKey) {
  return MIN_AGE[enKey] ?? 6;
}

// Words new to `age` (lessons), vs review words from younger ages.
export function splitNewAndReview(pool, age) {
  const fresh = [];
  const review = [];
  for (const w of pool || []) {
    if (minAgeOf(w.en) >= age) fresh.push(w);
    else review.push(w);
  }
  return { fresh, review };
}

// Display text: diacritized Arabic for ages ≤ 7, plain otherwise.
export function wordDisplay(word, age, lang = 'ar') {
  if (lang !== 'ar') return word.en;
  if (age != null && age <= 7) return AR_DIACRITIZED[word.ar] || word.ar;
  return word.ar;
}
