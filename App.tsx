import { ActiveFast, FastEntry } from './src/types';
import { Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { DEFAULT_RING_CONFIG, DEFAULT_TARGET_HOURS } from './src/config';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearActiveFast, loadActiveFast, loadHistory, saveActiveFast, saveHistory } from './src/utils/storage';

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

type PanelKey = 'history' | 'legend' | 'coffee';

const HOUR_MS = 3600_000;

function Main() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ringSize = Math.min(width - 40, height * 0.48, 380);
  const buttonSize = Math.round(ringSize * 0.7);

  const [targetHours, setTargetHours] = useState(DEFAULT_TARGET_HOURS);
  const [activeFast, setActiveFast] = useState<ActiveFast | null>(null);
  const [history, setHistory] = useState<FastEntry[]>([]);
  const [now, setNow] = useState(Date.now());
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);

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

  const endFast = useCallback(() => {
    if (!activeFast) {
      return;
    }
    Alert.alert('End fast?', 'The result will be saved to your history.', [
      { text: 'Keep fasting', style: 'cancel' },
      {
        text: 'End fast',
        style: 'destructive',
        onPress: () => {
          const entry: FastEntry = {
            id: String(Date.now()),
            startedAt: activeFast.startedAt,
            endedAt: Date.now(),
            targetHours: activeFast.targetHours,
          };
          const next = [entry, ...history];
          setHistory(next);
          setActiveFast(null);
          saveHistory(next);
          clearActiveFast();
        },
      },
    ]);
  }, [activeFast, history]);

  const onCenterPress = isRunning ? endFast : startFast;

  // Stable handlers so the memoized footer skips per-second clock re-renders.
  const openCoffee = useCallback(() => setOpenPanel('coffee'), []);
  const openHistory = useCallback(() => setOpenPanel('history'), []);
  const openLegend = useCallback(() => setOpenPanel('legend'), []);
  const closePanel = useCallback(() => setOpenPanel(null), []);

  // Press-in feedback on the center button.
  const centerScale = useSharedValue(1);
  const centerStyle = useAnimatedStyle(() => ({ transform: [{ scale: centerScale.value }] }));

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.root,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.header}>
          <Logo />
        </View>

        <View style={styles.main}>
          {/* All three layers share the same centered box, stacked back-to-front */}
          <View style={styles.layer} pointerEvents="box-none">
            <FastingRing size={ringSize} totalHours={ringHours} elapsedHours={elapsedHours} config={DEFAULT_RING_CONFIG} />
          </View>

          <View style={styles.layer} pointerEvents="box-none">
            <HoursDial value={targetHours} size={buttonSize} onChange={setHoursFromDial} disabled={isRunning} />
          </View>

          <View style={styles.layer} pointerEvents="box-none">
            <Pressable
              onPress={onCenterPress}
              onPressIn={() => {
                centerScale.value = withTiming(0.95, { duration: 90 });
              }}
              onPressOut={() => {
                centerScale.value = withSpring(1, { damping: 14, stiffness: 220 });
              }}
            >
              <Animated.View
                style={[styles.controlButtonWrapper, centerStyle]}
                layout={LinearTransition.springify().damping(18).stiffness(200)}
              >
                {isRunning ? (
                  <Animated.View
                    key="running"
                    style={styles.centerContent}
                    entering={FadeIn.duration(220)}
                    exiting={FadeOut.duration(120)}
                  >
                    <Text style={styles.elapsedLabel}>FASTING</Text>
                    <Text style={styles.elapsedTime}>{formatElapsed(elapsedMs)}</Text>
                    <Text style={styles.endHint}>tap to end</Text>
                  </Animated.View>
                ) : (
                  <Animated.View
                    key="idle"
                    style={styles.centerContent}
                    entering={FadeIn.duration(220)}
                    exiting={FadeOut.duration(120)}
                  >
                    <Text style={styles.controlButtonLabel}>HRS</Text>
                    <DigitalNumber value={targetHours} height={50} />
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
        {openPanel === 'history' && <HistoryList entries={history} />}
        {openPanel === 'legend' && <Legend />}
        {openPanel === 'coffee' && <Text style={styles.panelTitle}>Buy me a coffee</Text>}
      </SlidePanel>
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
    padding: 40,
    borderWidth: 1,
    borderRadius: 999,
    borderColor: '#dbe2eb',
    aspectRatio: 1 / 1,
  },
  centerContent: {
    alignItems: 'center',
    gap: 10,
  },
  controlButtonLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: colors.textPrimary,
  },

  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  endHint: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
