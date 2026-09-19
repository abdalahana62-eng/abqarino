import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, PanResponder, Animated } from 'react-native';
import { colors, font, fam, space, radius } from '../theme';
import { tap, hapticSuccess } from '../utils/speech';

// Phased drag-and-drop teaching game. Each game is a list of steps that
// together solve THE SAME problem the kid missed:
// - { mode:'collect', n, theme } drag n items into the basket (counts up)
// - { mode:'remove', show, take, theme } drag `take` of `show` items to the box
// - { mode:'count', from:'field'|'bin', limit, theme } auto-highlight + count
// Variety: theme (item/bin pair) rotates every step.
export const DRAG_THEMES = [
  { id: 'balls', item: '⚽', bin: '🧺', box: '📦', instr: 'drag_balls', hint: 'اسحب الكور للسلة' },
  { id: 'apples', item: '🍎', bin: '🧺', box: '📦', instr: 'drag_apples', hint: 'اسحب التفاح للسلة' },
  { id: 'fish', item: '🐟', bin: '🪣', box: '📦', instr: 'drag_fish', hint: 'اسحب السمك للجردل' },
  { id: 'stars', item: '⭐', bin: '🫙', box: '📦', instr: 'drag_stars', hint: 'اسحب النجوم للبرطمان' },
  { id: 'eggs', item: '🥚', bin: '🪹', box: '📦', instr: 'drag_eggs', hint: 'اسحب البيض للعش' },
  { id: 'candy', item: '🍬', bin: '🍽️', box: '📦', instr: 'drag_candy', hint: 'اسحب الحلوى للطبق' },
];

const ITEM = 62;
const FIELD_H = 430;

function scatter(count, w) {
  const cols = Math.min(4, Math.ceil(Math.sqrt(Math.max(1, count) * 1.4)));
  const spots = [];
  const usableW = Math.max(200, w - ITEM - 16);
  const rows = Math.ceil(Math.max(1, count) / cols);
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

function DragItem({ base, emoji, active, onActive, onDrop }) {
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
      onPanResponderTerminate: () => {
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.item,
        { left: base.x, top: base.y, zIndex: active ? 10 : 1 },
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
  useEffect(() => {
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

export default function DragCountGame({ steps, onCount, onStep, onDone, onSkip }) {
  const [boxW, setBoxW] = useState(340);
  const [si, setSi] = useState(0);
  const step = steps[si];
  const show = step.mode === 'remove' ? step.show : step.n;

  const [field, setField] = useState(() => Array.from({ length: show }, (_, i) => i));
  const [inBin, setInBin] = useState([]);
  const [inBox, setInBox] = useState([]);
  const [counter, setCounter] = useState(step.base || 0);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [pops, setPops] = useState([]);
  const [hl, setHl] = useState(-1);
  const popId = useRef(0);
  const spots = useMemo(() => scatter(show, boxW), [show, boxW, si]);
  const timer = useRef(null);

  // reset per-step state when the step changes
  useEffect(() => {
    const s = steps[si];
    const n = s.mode === 'remove' ? s.show : s.n;
    setField(Array.from({ length: n }, (_, i) => i));
    setInBin([]);
    setInBox([]);
    setHl(-1);
    setCounter(s.base || 0);
    onStep?.(si);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [si]);

  // auto-count (highlight) steps: pulse each target + count out loud
  useEffect(() => {
    if (step.mode !== 'count') return;
    const targets = step.from === 'bin' ? inBinSnapshot() : fieldSnapshot();
    const list = targets.slice(0, step.limit);
    let i = 0;
    timer.current = setInterval(() => {
      if (i >= list.length) {
        clearInterval(timer.current);
        setTimeout(() => goNext(), 700);
        return;
      }
      setHl(list[i]);
      const v = i + 1;
      setCounter(v);
      onCount?.(v, 'left');
      i += 1;
    }, 1150);
    return () => clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [si, field.length, inBin.length]);

  const inBinSnapshot = () => inBinRef.current;
  const fieldSnapshot = () => fieldRef.current;
  const inBinRef = useRef(inBin);
  inBinRef.current = inBin;
  const fieldRef = useRef(field);
  fieldRef.current = field;

  const goNext = () => {
    clearInterval(timer.current);
    if (si + 1 >= steps.length) onDone?.();
    else setSi(si + 1);
  };

  const zone = { x: boxW / 2 - 95, y: FIELD_H - 130, w: 190, h: 130 };

  const handleDrop = (id, cx, cy) => {
    const inside =
      cx >= zone.x && cx <= zone.x + zone.w && cy >= zone.y && cy <= zone.y + zone.h;
    if (!inside) {
      onStep?.(si, 'miss');
      return false;
    }
    hapticSuccess();
    const id2 = ++popId.current;
    setPops((p) => [...p, { id: id2, x: cx, y: cy }]);
    if (step.mode === 'collect') {
      const nb = [...inBin, id];
      setInBin(nb);
      setField((f) => f.filter((x) => x !== id));
      const v = (step.base || 0) + nb.length;
      setCounter(v);
      onCount?.(v, 'collect');
      if (nb.length >= step.n) setTimeout(goNext, 600);
    } else {
      const bx = [...inBox, id];
      setInBox(bx);
      setField((f) => f.filter((x) => x !== id));
      setCounter(bx.length);
      onCount?.(bx.length, 'remove');
      if (bx.length >= step.take) setTimeout(goNext, 600);
    }
    return true;
  };

  const zoneEmoji = step.mode === 'remove' ? step.theme.box : step.theme.bin;

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <View style={styles.counter}>
          <Text style={styles.counterTxt}>{counter}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.hint}>{step.hint || step.theme.hint} 👆</Text>
          {!!step.badge && <Text style={styles.badge}>{step.badge}</Text>}
        </View>
        <Pressable onPress={onSkip} hitSlop={10} style={styles.skip}>
          <Text style={styles.skipTxt}>تخطي ⏭</Text>
        </Pressable>
      </View>

      <View style={styles.field} onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}>
        {field.map((id, k) => (
          <React.Fragment key={id}>
            <DragItem
              base={spots[k] || { x: 10, y: 10 }}
              emoji={step.theme.item}
              active={activeIdx === id}
              onActive={() => setActiveIdx(id)}
              onDrop={(cx, cy) => {
                const ok = step.mode === 'count' ? false : handleDrop(id, cx, cy);
                if (!ok) setActiveIdx(-1);
                return ok;
              }}
            />
            {step.mode === 'count' && hl === id && (
              <View pointerEvents="none" style={[styles.hlRing, { left: (spots[k]?.x ?? 10) - 5, top: (spots[k]?.y ?? 10) - 5 }]} />
            )}
          </React.Fragment>
        ))}

        {step.mode !== 'count' && field.length > 0 && inBin.length + inBox.length === 0 && (
          <View pointerEvents="none" style={[styles.nudge, { left: spots[0]?.x ?? 20, top: (spots[0]?.y ?? 20) + ITEM + 2 }]}>
            <Text style={styles.nudgeTxt}>اسحبني 👆</Text>
          </View>
        )}

        <View pointerEvents="none" style={[styles.basket, { left: boxW / 2 - 75, top: FIELD_H - 120 }]}>
          <Text style={styles.basketTxt}>{zoneEmoji}</Text>
          {(inBin.length > 0 || inBox.length > 0) && (
            <View style={styles.miniRow}>
              {[...inBin, ...inBox].slice(-8).map((ci, j) => (
                <Text key={`${ci}-${j}`} style={[styles.miniTxt, step.mode === 'count' && hl === ci && styles.miniHl]}>
                  {step.theme.item}
                </Text>
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
    borderRadius: radius.round, minHeight: 44, justifyContent: 'center', minWidth: 64, alignItems: 'center',
  },
  counterTxt: { color: '#fff', fontFamily: fam.round, fontSize: font.md },
  hint: { fontSize: font.xs, fontFamily: fam.roundBold, color: colors.text, textAlign: 'right' },
  badge: { fontSize: 13, fontFamily: fam.roundMedium, color: colors.muted, textAlign: 'right' },
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
  hlRing: {
    position: 'absolute', width: ITEM + 10, height: ITEM + 10, borderRadius: (ITEM + 10) / 2,
    borderWidth: 5, borderColor: colors.success, backgroundColor: 'rgba(34,197,94,0.15)',
  },
  nudge: { position: 'absolute', backgroundColor: '#221C46', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  nudgeTxt: { color: '#fff', fontFamily: fam.roundBold, fontSize: 13 },
  basket: { position: 'absolute', width: 150, alignItems: 'center' },
  basketTxt: { fontSize: 92 },
  miniRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', marginTop: -18 },
  miniTxt: { fontSize: 22 },
  miniHl: { fontSize: 30 },
  pop: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  popTxt: { fontSize: 52 },
});
