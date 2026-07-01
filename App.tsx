import { ActiveFast, FastEntry } from './src/types';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { DEFAULT_RING_CONFIG, DEFAULT_TARGET_HOURS } from './src/config';
import { Pressable, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearActiveFast, loadActiveFast, loadHistory, saveActiveFast, saveHistory } from './src/utils/storage';

import CelebrationOverlay from './src/components/CelebrationOverlay';
import Coffee from './src/components/side-panels/Coffee';
import DigitalNumber from './src/components/DigitalNumber';
import FastingRing from './src/components/FastingRing';
import Footer from './src/components/layout/Footer';
import HistoryList from './src/components/side-panels/HistoryList';
import HoursDial from './src/components/HoursDial';
import Legend from './src/components/side-panels/Legend';
import Logo from './src/components/layout/Logo';
import SlidePanel from './src/components/SlidePanel';
import { colors } from './src/theme';
import { formatElapsed } from './src/utils/format';
import { scheduleOnRN } from 'react-native-worklets';

type PanelKey = 'history' | 'legend' | 'coffee';

const HOUR_MS = 3600_000;

// Ending a fast requires holding the center button this long while a radial
// fill confirms the intent — no native popup, no accidental taps.
const HOLD_TO_END_MS = 1200;

function Main() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ringSize = Math.min(width - 40, height * 0.48, 380);
  const buttonSize = Math.round(ringSize * 0.7);
  // The tappable start/stop circle is deliberately smaller than the dial, so
  // grabbing the knob's rim to set hours can't accidentally trigger it.
  const centerSize = Math.round(buttonSize * 0.66);

  const [targetHours, setTargetHours] = useState(DEFAULT_TARGET_HOURS);
  const [activeFast, setActiveFast] = useState<ActiveFast | null>(null);
  const [history, setHistory] = useState<FastEntry[]>([]);
  const [now, setNow] = useState(Date.now());
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);
  // Bumped each time a fast ends to fire the celebration burst.
  const [celebrateAt, setCelebrateAt] = useState(0);

  // Restore persisted state on launch.
  useEffect(() => {
    (async () => {
      const [active, entries] = await Promise.all([loadActiveFast(), loadHistory()]);
      if (active) {
        setActiveFast(active);
        setTargetHours(active.targetHours);
      }
      setHistory(entries);
    })();
  }, []);

  // Tick once per second while a fast is running.
  useEffect(() => {
    if (!activeFast) {
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeFast]);

  const isRunning = activeFast !== null;
  const elapsedMs = isRunning ? Math.max(0, now - activeFast.startedAt) : 0;
  const elapsedHours = elapsedMs / HOUR_MS;
  // While running the ring scale is locked to the fast that was started,
  // so dial input can't rescale a fast in progress.
  const ringHours = activeFast?.targetHours ?? targetHours;

  // The drag dial spans its own 0–99 range, independent of the stepper bounds.
  const setHoursFromDial = useCallback((h: number) => {
    setTargetHours(Math.max(0, Math.min(99, h)));
  }, []);

  const startFast = useCallback(() => {
    const fast: ActiveFast = { startedAt: Date.now(), targetHours };
    setActiveFast(fast);
    saveActiveFast(fast);
  }, [targetHours]);

  // Confirmation happens physically (the hold gesture below), so ending
  // commits straight to history.
  const endFast = useCallback(() => {
    if (!activeFast) {
      return;
    }
    const entry: FastEntry = {
      id: String(Date.now()),
      startedAt: activeFast.startedAt,
      endedAt: Date.now(),
      targetHours: activeFast.targetHours,
    };
    const next = [entry, ...history];
    setHistory(next);
    setActiveFast(null);
    setCelebrateAt(Date.now());
    saveHistory(next);
    clearActiveFast();
  }, [activeFast, history]);

  // Permanently drop the given history entries (from the history panel).
  const deleteEntries = useCallback(
    (ids: string[]) => {
      const remove = new Set(ids);
      setHistory(prev => {
        const next = prev.filter(e => !remove.has(e.id));
        saveHistory(next);
        return next;
      });
    },
    [],
  );

  // Stable handlers so the memoized footer skips per-second clock re-renders.
  const openCoffee = useCallback(() => setOpenPanel('coffee'), []);
  const openHistory = useCallback(() => setOpenPanel('history'), []);
  const openLegend = useCallback(() => setOpenPanel('legend'), []);
  const closePanel = useCallback(() => setOpenPanel(null), []);

  // Stable children element so the per-second clock tick doesn't re-commit
  // into the panel subtree — a commit landing mid-slide interrupts the
  // Reanimated timing and left the panel stuck partway in.
  const panelContent = useMemo(
    () => (
      <>
        {openPanel === 'history' && <HistoryList entries={history} onDelete={deleteEntries} />}
        {openPanel === 'legend' && <Legend />}
        {openPanel === 'coffee' && <Coffee />}
      </>
    ),
    [openPanel, history, deleteEntries],
  );

  // Press-in feedback on the center button.
  const centerScale = useSharedValue(1);
  const centerStyle = useAnimatedStyle(() => ({ transform: [{ scale: centerScale.value }] }));

  // Hold-to-end: a disc grows from the button's center while held; reaching
  // full size ends the fast, releasing early rewinds it.
  const holdProgress = useSharedValue(0);
  const holdFillStyle = useAnimatedStyle(() => ({
    opacity: holdProgress.value > 0.01 ? 0.22 : 0,
    transform: [{ scale: holdProgress.value }],
  }));

  // After a completed hold ends the fast, the finger lift still fires
  // onPress — without this guard it would instantly start a new fast.
  const holdConsumedPress = useRef(false);

  const completeHold = useCallback(() => {
    holdConsumedPress.current = true;
    endFast();
  }, [endFast]);

  const onCenterPressIn = useCallback(() => {
    holdConsumedPress.current = false;
    centerScale.value = withTiming(0.95, { duration: 90 });
    if (isRunning) {
      holdProgress.value = withTiming(1, { duration: HOLD_TO_END_MS }, finished => {
        if (finished) {
          holdProgress.value = 0;
          scheduleOnRN(completeHold);
        }
      });
    }
  }, [isRunning, completeHold, centerScale, holdProgress]);

  const onCenterPressOut = useCallback(() => {
    centerScale.value = withSpring(1, { damping: 14, stiffness: 220 });
    // Released early — rewind the fill. (No-op after a completed hold.)
    holdProgress.value = withTiming(0, { duration: 160 });
  }, [centerScale, holdProgress]);

  const onCenterPress = useCallback(() => {
    if (holdConsumedPress.current) {
      holdConsumedPress.current = false;
      return;
    }
    if (!isRunning) {
      startFast();
    }
  }, [isRunning, startFast]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={[styles.root, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 60 }]}>
        <View style={styles.header}>
          <Logo />
        </View>

        <View style={styles.main}>
          {/* All three layers share the same centered box, stacked back-to-front */}
          <View style={styles.layer} pointerEvents="box-none">
            <FastingRing
              size={ringSize}
              totalHours={ringHours}
              elapsedHours={elapsedHours}
              config={DEFAULT_RING_CONFIG}
            />
          </View>

          <View style={styles.layer} pointerEvents="box-none">
            <HoursDial value={targetHours} size={buttonSize} onChange={setHoursFromDial} disabled={isRunning} />
          </View>

          <View style={styles.layer} pointerEvents="box-none">
            <Pressable onPress={onCenterPress} onPressIn={onCenterPressIn} onPressOut={onCenterPressOut}>
              <Animated.View
                style={[
                  styles.controlButtonWrapper,
                  { width: centerSize, height: centerSize, borderRadius: centerSize / 2 },
                  centerStyle,
                ]}
              >
                {/* Radial fill that grows while the button is held to end a fast */}
                <Animated.View
                  style={[styles.holdFill, { borderRadius: centerSize / 2 }, holdFillStyle]}
                  pointerEvents="none"
                />

                {isRunning ? (
                  <Animated.View
                    key="running"
                    style={styles.centerContent}
                    entering={FadeIn.duration(220)}
                    exiting={FadeOut.duration(120)}
                  >
                    <Text style={styles.elapsedLabel}>FASTING</Text>
                    <Text style={styles.elapsedTime}>{formatElapsed(elapsedMs)}</Text>
                    <Text style={styles.endHint}>hold to end</Text>
                  </Animated.View>
                ) : (
                  <Animated.View
                    key="idle"
                    style={styles.centerContent}
                    entering={FadeIn.duration(220)}
                    exiting={FadeOut.duration(120)}
                  >
                    <Text style={styles.controlButtonLabel}>HRS</Text>
                    <DigitalNumber value={targetHours} width={70} height={50} />
                    <Text style={styles.controlButtonLabel}>START</Text>
                  </Animated.View>
                )}
              </Animated.View>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Footer onBuyMeCoffeeClick={openCoffee} onHistoryClick={openHistory} onLegendClick={openLegend} />
        </View>
      </View>

      <SlidePanel visible={openPanel !== null} onClose={closePanel}>
        {panelContent}
      </SlidePanel>

      <CelebrationOverlay trigger={celebrateAt} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Layout
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  root: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
  },
  header: {
    width: '100%',
    alignItems: 'center',
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0,
  },

  // Each child sits in its own absolutely-filled, centered layer so they
  // stack on top of one another instead of flowing in a column.
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  controlButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: 'hidden',
  },
  centerContent: {
    alignItems: 'center',
    gap: 10,
  },
  holdFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.accent,
  },
  controlButtonLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: colors.textPrimary,
  },

  elapsedLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  elapsedTime: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  endHint: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
