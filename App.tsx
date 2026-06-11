import { ActiveFast, FastEntry } from './src/types';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
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
import { formatDay, formatElapsed, formatTime } from './src/format';

import FastingRing from './src/FastingRing';
import HistoryList from './src/HistoryList';

const HOUR_MS = 3600_000;

export default function App() {
  const { width } = useWindowDimensions();
  const ringSize = Math.min(width - 32, 380);

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
  const startMs = isRunning ? activeFast.startedAt : now;
  const targetMs = startMs + targetHours * HOUR_MS;
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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Wordmark */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            Fast<Text style={styles.logoAccent}>R</Text>
          </Text>
          <Text style={styles.tagline}>Track your fast</Text>
        </View>

        <FastingRing
          size={ringSize}
          totalHours={targetHours}
          elapsedHours={elapsedHours}
          config={ringConfig}
        >
          {isRunning ? (
            <Pressable
              style={[styles.centerButton, styles.centerButtonRunning]}
              onPress={endFast}
            >
              <Text style={styles.elapsedLabel}>FASTING</Text>
              <Text style={styles.elapsedTime}>{formatElapsed(elapsedMs)}</Text>
              <Text style={styles.endHint}>tap to end</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.centerButton} onPress={startFast}>
              <Text style={styles.startText}>START</Text>
            </Pressable>
          )}
        </FastingRing>

        {/* Duration stepper — hidden while fasting */}
        {!isRunning && (
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepperButton}
              onPress={() => adjustHours(-1)}
            >
              <Text style={styles.stepperSign}>−</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{targetHours} hrs</Text>
            <Pressable
              style={styles.stepperButton}
              onPress={() => adjustHours(1)}
            >
              <Text style={styles.stepperSign}>+</Text>
            </Pressable>
          </View>
        )}

        {/* Start / target times */}
        <View style={styles.timesRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Start</Text>
            <Text style={styles.timeValue}>{formatDay(startMs)}</Text>
            <Text style={styles.timeValue}>{formatTime(startMs)}</Text>
          </View>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Target</Text>
            <Text style={styles.timeValue}>{formatDay(targetMs)}</Text>
            <Text style={styles.timeValue}>{formatTime(targetMs)}</Text>
          </View>
        </View>

        <HistoryList entries={history} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scroll: {
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#1C1C1E',
  },
  logoAccent: {
    color: '#34B3E8',
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#8E8E93',
    marginTop: 2,
  },
  centerButton: {
    width: '62%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#62C4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonRunning: {
    backgroundColor: '#4FB6E6',
  },
  startText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1,
  },
  elapsedLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  elapsedTime: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  endHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -28, // tucks into the ring's bottom gap, like the screenshot
    marginBottom: 8,
  },
  stepperButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSign: {
    fontSize: 22,
    lineHeight: 24,
    color: '#1C1C1E',
  },
  stepperValue: {
    fontSize: 26,
    fontWeight: '500',
    color: '#1C1C1E',
    marginHorizontal: 16,
    fontVariant: ['tabular-nums'],
  },
  timesRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
    marginBottom: 24,
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 6,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#8E8E93',
    marginBottom: 6,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
});
