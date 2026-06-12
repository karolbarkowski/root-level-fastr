import { ActiveFast, FastEntry } from './src/types';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  DEFAULT_RING_CONFIG,
  DEFAULT_TARGET_HOURS,
  MAX_TARGET_HOURS,
  MIN_TARGET_HOURS,
} from './src/config';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  clearActiveFast,
  loadActiveFast,
  loadHistory,
  saveActiveFast,
  saveHistory,
} from './src/storage';

import DigitalNumber from './src/DigitalNumber';
import FastingRing from './src/FastingRing';
import HoursDial from './src/HoursDial';
import Logo from './src/Logo';
import { colors } from './src/theme';

const HOUR_MS = 3600_000;

export default function App() {
  const { width } = useWindowDimensions();
  const ringSize = Math.min(width - 40, 380);
  const buttonSize = Math.round(ringSize * 0.7);

  const [targetHours, setTargetHours] = useState(DEFAULT_TARGET_HOURS);
  const [activeFast, setActiveFast] = useState<ActiveFast | null>(null);
  const [history, setHistory] = useState<FastEntry[]>([]);
  const [now, setNow] = useState(Date.now());

  // Restore persisted state on launch.
  useEffect(() => {
    (async () => {
      const [active, entries] = await Promise.all([
        loadActiveFast(),
        loadHistory(),
      ]);
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
  const elapsedMs = isRunning ? now - activeFast.startedAt : 0;
  const elapsedHours = elapsedMs / HOUR_MS;

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

  const ringConfig = useMemo(() => DEFAULT_RING_CONFIG, []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Logo />
      </View>

      <View style={styles.main}>
        {/* All three layers share the same centered box, stacked back-to-front */}
        <View style={styles.layer} pointerEvents="box-none">
          <FastingRing
            size={ringSize}
            totalHours={targetHours}
            elapsedHours={elapsedHours}
            config={ringConfig}
          />
        </View>

        <View style={styles.layer} pointerEvents="box-none">
          <HoursDial
            value={targetHours}
            size={buttonSize}
            onChange={setHoursFromDial}
          />
        </View>

        <View style={styles.layer} pointerEvents="none">
          <View style={styles.controlButtonWrapper}>
            <Text style={styles.controlButtonLabel}>HRS</Text>
            <DigitalNumber value={targetHours} height={50} />
            <Text style={styles.controlButtonLabel}>START</Text>
          </View>
        </View>
      </View>

      {/* <View style={styles.footer}>
        <HistoryList entries={history} />
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout
  root: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingVertical: 80,
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
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: 40,
    borderWidth: 1,
    borderRadius: 999,
    borderColor: '#dbe2eb',
    aspectRatio: 1 / 1,
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
