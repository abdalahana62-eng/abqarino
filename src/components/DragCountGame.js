import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, PanResponder, Animated } from 'react-native';
import { colors, font, fam, space, radius } from '../theme';
import { tap, hapticSuccess } from '../utils/speech';

// Drag-and-drop counting game: the teacher asks the kid to drag each item
// into the basket and count along. Every successful drop pops with a star
// burst. Themes rotate for variety (balls, apples, fish, stars, eggs, candy).
export const DRAG_THEMES = [
  { id: 'balls', item: '⚽', bin: '🧺', instr: 'drag_balls', hint: 'اسحب الكور للسلة' },
  { id: 'apples', item: '🍎', bin: '🧺', instr: 'drag_apples', hint: 'اسحب التفاح للسلة' },
  { id: 'fish', item: '🐟', bin: '🪣', instr: 'drag_fish', hint: 'اسحب السمك للجردل' },
  { id: 'stars', item: '⭐', bin: '🫙', instr: 'drag_stars', hint: 'اسحب النجوم للبرطمان' },
  { id: 'eggs', item: '🥚', bin: '🪹', instr: 'drag_eggs', hint: 'اسحب البيض للعش' },
  { id: 'candy', item: '🍬', bin: '🍽️', instr: 'drag_candy', hint: 'اسحب الحلوى للطبق' },
];

const ITEM = 62;
const FIELD_H = 430;

function scatter(count, w) {
  // Even grid with a deterministic wiggle so items never overlap badly.
  const cols = Math.min(4, Math.ceil(Math.sqrt(count * 1.4)));
  const spots = [];
  const usableW = Math.max(200, w - ITEM - 16);
  const rows = Math.ceil(count / cols);
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const inRow = Math.min(cols, count - r * cols);
    const cellW = usableW / inRow;
    const x = 8 + c * cellW + ((r * 37 + c * 53) % Math.max(10, cellW - ITEM));
    const y = 8 + r * ((FIELD_H - 170) / Math.max(1, rows)) + ((i * 29) % 14);
    spots.push({ x, y });
  }
  return spots;
}

function DragItem({ base, emoji, active, onActive, onDrop, dimmed }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        tap();
        onActive();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        const cx = base.x + g.dx + ITEM / 2;
        const cy = base.y + g.dy + ITEM / 2;
        if (!onDrop(cx, cy)) {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.item,
        { left: base.x, top: base.y, zIndex: active ? 10 : 1, opacity: dimmed ? 0.35 : 1 },
        { transform: pan.getTranslateTransform() },
      ]}
    >
      <Text style={styles.itemTxt}>{emoji}</Text>
    </Animated.View>
  );
}

function PopBurst({ x, y, onGone }) {
  const s = useRef(new Animated.Value(0.4)).current;
  const o = useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(s, { toValue: 1.5, friction: 4, useNativeDriver: true }),
      Animated.timing(o, { toValue: 0, duration: 550, useNativeDriver: true }),
    ]).start(() => onGone());
  }, [s, o, onGone]);
  return (
    <Animated.View pointerEvents="none" style={[styles.pop, { left: x - 30, top: y - 30, opacity: o, transform: [{ scale: s }] }]}>
      <Text style={styles.popTxt}>⭐</Text>
    </Animated.View>
  );
}

export default function DragCountGame({ count, theme, onCount, onDone, onSkip }) {
  const [boxW, setBoxW] = useState(340);
  const [collected, setCollected] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [pops, setPops] = useState([]);
  const spots = useMemo(() => scatter(count, boxW), [count, boxW]);
  const popId = useRef(0);
  const finished = useRef(false);

  const basket = { x: boxW / 2 - 95, y: FIELD_H - 130, w: 190, h: 130 };

  const handleDrop = (idx, cx, cy) => {
    const inside =
      cx >= basket.x && cx <= basket.x + basket.w && cy >= basket.y && cy <= basket.y + basket.h;
    if (!inside) return false;
    if (collected.includes(idx)) return true;
    const next = [...collected, idx];
    setCollected(next);
    hapticSuccess();
    const id = ++popId.current;
    setPops((p) => [...p, { id, x: cx, y: cy }]);
    onCount?.(next.length);
    if (next.length >= count && !finished.current) {
      finished.current = true;
      setTimeout(() => onDone?.(), 900);
    }
    return true;
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <View style={styles.counter}>
          <Text style={styles.counterTxt}>
            {collected.length} / {count}
          </Text>
        </View>
        <Text style={styles.hint}>{theme.hint} 👆</Text>
        <Pressable onPress={onSkip} hitSlop={10} style={styles.skip}>
          <Text style={styles.skipTxt}>تخطي ⏭</Text>
        </Pressable>
      </View>

      <View
        style={styles.field}
        onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}
      >
        {spots.map((s, i) =>
          collected.includes(i) ? null : (
            <DragItem
              key={i}
              base={s}
              emoji={theme.item}
              active={activeIdx === i}
              dimmed={collected.length === 0 && i !== 0}
              onActive={() => setActiveIdx(i)}
              onDrop={(cx, cy) => {
                const ok = handleDrop(i, cx, cy);
                if (!ok) setActiveIdx(-1);
                return ok;
              }}
            />
          )
        )}

        {collected.length === 0 && (
          <View pointerEvents="none" style={[styles.nudge, { left: spots[0]?.x ?? 20, top: (spots[0]?.y ?? 20) + ITEM + 2 }]}>
            <Text style={styles.nudgeTxt}>اسحبني 👆</Text>
          </View>
        )}

        <View pointerEvents="none" style={[styles.basket, { left: boxW / 2 - 75, top: FIELD_H - 120 }]}>
          <Text style={styles.basketTxt}>{theme.bin}</Text>
          {collected.length > 0 && (
            <View style={styles.miniRow}>
              {collected.slice(-6).map((ci) => (
                <Text key={ci} style={styles.miniTxt}>{theme.item}</Text>
              ))}
            </View>
          )}
        </View>

        {pops.map((p) => (
          <PopBurst key={p.id} x={p.x} y={p.y} onGone={() => setPops((ps) => ps.filter((q) => q.id !== p.id))} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  headRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  counter: {
    backgroundColor: '#221C46', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: radius.round, minHeight: 44, justifyContent: 'center',
  },
  counterTxt: { color: '#fff', fontFamily: fam.round, fontSize: font.md },
  hint: { flex: 1, fontSize: font.xs, fontFamily: fam.roundBold, color: colors.text, textAlign: 'right' },
  skip: {
    backgroundColor: colors.cardBg, borderWidth: 2, borderColor: colors.cardBorder,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.round, minHeight: 44, justifyContent: 'center',
  },
  skipTxt: { fontFamily: fam.roundBold, fontSize: font.xs, color: colors.muted },
  field: {
    height: FIELD_H, backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 24, overflow: 'hidden', position: 'relative',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)',
  },
  item: {
    position: 'absolute', width: ITEM, height: ITEM, borderRadius: ITEM / 2,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#5A45D6', shadowOpacity: 0.25, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  itemTxt: { fontSize: 38 },
  nudge: { position: 'absolute', backgroundColor: '#221C46', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  nudgeTxt: { color: '#fff', fontFamily: fam.roundBold, fontSize: 13 },
  basket: { position: 'absolute', width: 150, alignItems: 'center' },
  basketTxt: { fontSize: 92 },
  miniRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', marginTop: -18 },
  miniTxt: { fontSize: 22 },
  pop: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  popTxt: { fontSize: 52 },
});
