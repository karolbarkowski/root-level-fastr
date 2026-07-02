import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';

import { appFont, colors } from '../theme';

// A celebratory burst shown when a fast is ended: confetti rains down while a
// "Good job!" badge springs in, then the whole thing fades itself out.
const PIECE_COUNT = 70;
const DURATION_MS = 2600;

// Ember-and-monochrome confetti to match the dark flat palette.
const CONFETTI_COLORS = ['#FF6B1A', '#FF9558', '#FFD166', '#ECECEC', '#FFFFFF', '#8C8C8C'];

interface PieceProps {
  index: number;
  screenW: number;
  screenH: number;
}

/** A single confetti rectangle that falls, drifts and tumbles on mount. */
function ConfettiPiece({ index, screenW, screenH }: PieceProps) {
  // Deterministic pseudo-random spread so pieces don't all share a path.
  // (Math.random is unavailable in worklets / some harnesses; derive from index.)
  const seed = useMemo(() => {
    const r = (n: number) => {
      const x = Math.sin(index * 9301 + n * 49297) * 233280;
      return x - Math.floor(x);
    };
    return {
      startX: r(1) * screenW,
      drift: (r(2) - 0.5) * 160,
      delay: r(3) * 500,
      duration: DURATION_MS - 600 + r(4) * 600,
      size: 7 + r(5) * 8,
      color: CONFETTI_COLORS[Math.floor(r(6) * CONFETTI_COLORS.length)],
      spin: (r(7) - 0.5) * 12,
      round: r(8) > 0.7,
    };
  }, [index, screenW]);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(seed.delay, withTiming(1, { duration: seed.duration, easing: Easing.in(Easing.quad) }));
  }, [progress, seed]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: seed.drift * progress.value },
      { translateY: -40 + (screenH + 80) * progress.value },
      { rotate: `${seed.spin * progress.value * Math.PI}rad` },
    ],
    // Fade out over the last fifth of the fall.
    opacity: progress.value < 0.8 ? 1 : 1 - (progress.value - 0.8) / 0.2,
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: seed.startX,
          width: seed.size,
          height: seed.size * 1.6,
          backgroundColor: seed.color,
          borderRadius: seed.round ? seed.size : 2,
        },
        style,
      ]}
    />
  );
}

/** The springy "Good job!" badge in the center of the screen. */
function Badge() {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1, { damping: 9, stiffness: 160 }),
      withDelay(1400, withTiming(0.9, { duration: 300 })),
    );
  }, [scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.badge, style]}>
      <Text style={styles.badgeEmoji}>🎉</Text>
      <Text style={styles.badgeTitle}>Good job!</Text>
      <Text style={styles.badgeSubtitle}>Fast complete</Text>
    </Animated.View>
  );
}

interface Props {
  /** Bump this to a new value each time a celebration should play. */
  trigger: number;
}

/**
 * Full-screen, non-interactive celebration. Mounts its confetti + badge when
 * `trigger` changes, then unmounts itself after the burst finishes so it costs
 * nothing while idle.
 */
export default function CelebrationOverlay({ trigger }: Props) {
  const { width, height } = useWindowDimensions();
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (trigger <= 0) {
      return;
    }
    setRun(trigger);
    const id = setTimeout(() => setRun(0), DURATION_MS);
    return () => clearTimeout(id);
  }, [trigger]);

  if (run === 0) {
    return null;
  }

  return (
    <Animated.View
      key={run}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      entering={FadeIn.duration(120)}
      exiting={FadeOut.duration(400)}
    >
      <View style={StyleSheet.absoluteFill}>
        {Array.from({ length: PIECE_COUNT }, (_, i) => (
          <ConfettiPiece key={i} index={i} screenW={width} screenH={height} />
        ))}
      </View>
      <View style={styles.badgeLayer} pointerEvents="none">
        <Badge />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
  },
  badgeLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 22,
    paddingHorizontal: 40,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  badgeEmoji: {
    fontSize: 40,
    marginBottom: 6,
  },
  badgeTitle: {
    fontFamily: appFont,
    fontSize: 26,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  badgeSubtitle: {
    fontFamily: appFont,
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
});
