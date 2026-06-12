import { ActiveFast, FastEntry } from './src/types';
import {
  Alert,
  Pressable,
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
import Logo from './src/Logo';
import SoftCard from './src/SoftCard';
import { colors } from './src/theme';
import { formatElapsed } from './src/format';

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

  const adjustHours = useCallback((delta: number) => {
    setTargetHours(h =>
      Math.min(MAX_TARGET_HOURS, Math.max(MIN_TARGET_HOURS, h + delta)),
    );
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
      <Logo />

      <View style={styles.main}>
        <FastingRing
          size={ringSize}
          totalHours={targetHours}
          elapsedHours={elapsedHours}
          config={ringConfig}
        >
          <SoftCard
            contentStyle={[
              styles.centerButton,
              { width: buttonSize, height: buttonSize },
            ]}
            radius={buttonSize / 2}
            distance={6}
          >
            {!isRunning && (
              <Pressable style={styles.centerPressable} onPress={startFast}>
                <Text style={styles.startText}>START</Text>
              </Pressable>
            )}

            {isRunning && (
              <Pressable style={styles.centerPressable} onPress={endFast}>
                <Text style={styles.elapsedLabel}>FASTING</Text>
                <Text style={styles.elapsedTime}>
                  {formatElapsed(elapsedMs)}
                </Text>
                <Text style={styles.endHint}>tap to end</Text>
              </Pressable>
            )}
          </SoftCard>
        </FastingRing>

        {/* Duration stepper — flat, hidden while fasting */}
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepperButton}
            hitSlop={8}
            onPress={() => adjustHours(-1)}
          >
            <Text style={styles.stepperSign}>−</Text>
          </Pressable>
          <DigitalNumber value={targetHours} width={90} />
          {/* <Text style={styles.stepperValue}>{targetHours} hrs</Text> */}
          <Pressable
            style={styles.stepperButton}
            hitSlop={8}
            onPress={() => adjustHours(1)}
          >
            <Text style={styles.stepperSign}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* <View style={styles.footer}>
        <HistoryList entries={history} />
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
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
  centerButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 4,
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -24, // tucks into the ring's bottom gap
    marginBottom: 8,
  },
  stepperButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSign: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '300',
    color: colors.textSecondary,
  },
  stepperValue: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.textPrimary,
    marginHorizontal: 24,
    fontVariant: ['tabular-nums'],
  },
});
