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
import { formatElapsed } from './src/format';

import FastingRing from './src/FastingRing';
import HistoryList from './src/HistoryList';
import SoftCard from './src/SoftCard';
import { colors } from './src/theme';

const HOUR_MS = 3600_000;

export default function App() {
  const { width } = useWindowDimensions();
  const ringSize = Math.min(width - 40, 380);
  const buttonSize = Math.round(ringSize * 0.62);

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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
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
            <SoftCard
              contentStyle={[
                styles.centerButton,
                { width: buttonSize, height: buttonSize },
              ]}
              radius={buttonSize / 2}
              distance={9}
              blur={18}
              surfaceColor={colors.accentDark}
            >
              <Pressable style={styles.centerPressable} onPress={endFast}>
                <Text style={styles.elapsedLabel}>FASTING</Text>
                <Text style={styles.elapsedTime}>
                  {formatElapsed(elapsedMs)}
                </Text>
                <Text style={styles.endHint}>tap to end</Text>
              </Pressable>
            </SoftCard>
          ) : (
            <SoftCard
              contentStyle={[
                styles.centerButton,
                { width: buttonSize, height: buttonSize },
              ]}
              radius={buttonSize / 2}
              distance={9}
              blur={18}
              surfaceColor={colors.accent}
            >
              <Pressable style={styles.centerPressable} onPress={startFast}>
                <Text style={styles.startText}>START</Text>
              </Pressable>
            </SoftCard>
          )}
        </FastingRing>

        {/* Duration stepper — hidden while fasting */}
        {!isRunning && (
          <View style={styles.stepper}>
            <SoftCard
              contentStyle={styles.stepperButton}
              radius={27}
              distance={5}
              blur={11}
            >
              <Pressable
                style={styles.stepperPressable}
                onPress={() => adjustHours(-1)}
              >
                <Text style={styles.stepperSign}>−</Text>
              </Pressable>
            </SoftCard>
            <Text style={styles.stepperValue}>{targetHours} hrs</Text>
            <SoftCard
              contentStyle={styles.stepperButton}
              radius={27}
              distance={5}
              blur={11}
            >
              <Pressable
                style={styles.stepperPressable}
                onPress={() => adjustHours(1)}
              >
                <Text style={styles.stepperSign}>+</Text>
              </Pressable>
            </SoftCard>
          </View>
        )}

        <HistoryList entries={history} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  logo: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.textPrimary,
  },
  logoAccent: {
    color: colors.accent,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginTop: 2,
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
    marginTop: -24, // tucks into the ring's bottom gap
    marginBottom: 8,
  },
  stepperButton: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperPressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSign: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stepperValue: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.textPrimary,
    marginHorizontal: 24,
    fontVariant: ['tabular-nums'],
  },
});
