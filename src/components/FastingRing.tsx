import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import React, { FC, ReactNode, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

import { RingConfig } from '../types';
import { colors } from '../theme';

interface Props {
  size: number;
  /** Total length of the fast in hours (full gauge sweep). */
  totalHours: number;
  /** Hours elapsed so far; ticks up to this point are "lit". 0 when idle. */
  elapsedHours: number;
  config: RingConfig;
  /** Rendered centered inside the gauge (the disc / timer). */
  children?: ReactNode;
}

// Gauge geometry: 270° sweep with the gap at the bottom.
// t ∈ [0, 1] maps to screen angle 135° → 405°, clockwise.
const START_ANGLE = 135;
const SWEEP = 270;

const TICK_COUNT = 135; // fine ticks around the dial
const TICK_LEN = 12;
const TICK_WIDTH = 1;
const OUTER_INSET = 18; // gap from the canvas edge to the tick tips (room for icon chips)
const HEAD_LEN = 22; // current-position marker
const HEAD_WIDTH = 3.5;
const MARKER_SIZE = 30; // milestone icon chips
const MARKER_ICON_SIZE = 18; // svg glyph inside each chip

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

interface ChipProps {
  icon: FC<SvgProps>;
  reached: boolean;
  /** Ring center and radius the chip is seated on. */
  cx: number;
  cy: number;
  r: number;
  /** Target screen angle (degrees); the chip glides along the arc to it. */
  deg: number;
}

/**
 * A milestone icon chip that "pops" (overshoot scale) the moment the fast
 * crosses its breakpoint. Restored fasts mount already-reached chips at rest.
 *
 * When the dial rescales the gauge, the chip's angle is animated (not its
 * x/y), so it slides along the ring's arc instead of cutting across it.
 */
const MilestoneChip = React.memo(({ icon: Icon, reached, cx, cy, r, deg }: ChipProps) => {
  const scale = useSharedValue(1);
  const angle = useSharedValue(deg);
  const prevReached = useRef(reached);

  useEffect(() => {
    // Short enough that rapid dial steps read as one continuous glide along
    // the arc instead of the chip visibly trailing the finger.
    angle.value = withTiming(deg, { duration: 100, easing: Easing.out(Easing.quad) });
  }, [deg, angle]);

  useEffect(() => {
    if (reached && !prevReached.current) {
      scale.value = withSequence(
        withTiming(1.35, { duration: 160 }),
        withSpring(1, { damping: 12, stiffness: 240 }),
      );
    }
    prevReached.current = reached;
  }, [reached, scale]);

  const chipStyle = useAnimatedStyle(() => {
    const rad = (angle.value * Math.PI) / 180;
    return {
      transform: [
        { translateX: cx + r * Math.cos(rad) - MARKER_SIZE / 2 },
        { translateY: cy + r * Math.sin(rad) - MARKER_SIZE / 2 },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.View style={[styles.marker, reached && styles.markerReached, chipStyle]}>
      <Icon width={MARKER_ICON_SIZE} height={MARKER_ICON_SIZE} />
    </Animated.View>
  );
});

function FastingRing({ size, totalHours, elapsedHours, config, children }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - OUTER_INSET;
  const rMarker = rOuter - TICK_LEN / 2; // chip centered on the tick band

  const progress = Math.min(Math.max(elapsedHours / totalHours, 0), 1);

  const milestones = useMemo(
    () =>
      config.breakpoints
        .filter(bp => bp.hoursIn > 0 && bp.hoursIn < totalHours)
        .sort((a, b) => a.hoursIn - b.hoursIn)
        .map(bp => ({ ...bp, frac: bp.hoursIn / totalHours })),
    [config.breakpoints, totalHours],
  );

  // Number of ticks currently lit. Quantizing progress to this integer keeps
  // the memo below stable between ticks lighting up, so the 135 <Line>
  // elements aren't rebuilt on every one-second clock update.
  const litCount = Math.floor(progress * (TICK_COUNT - 1) + 1e-6) + (progress > 0 ? 1 : 0);

  // Evenly spaced gauge ticks; the elapsed portion is "lit".
  const ticks = useMemo(() => {
    const out = [];
    for (let i = 0; i < TICK_COUNT; i++) {
      const t = i / (TICK_COUNT - 1);
      const deg = START_ANGLE + SWEEP * t;
      const lit = i < litCount;
      const p1 = polar(cx, cy, rOuter - TICK_LEN, deg);
      const p2 = polar(cx, cy, rOuter, deg);
      out.push(
        <Line
          key={`t-${i}`}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={lit ? colors.ringProgress : colors.ringTrack}
          strokeWidth={TICK_WIDTH}
          strokeLinecap="round"
        />,
      );
    }
    return out;
  }, [cx, cy, rOuter, litCount]);

  // Brighter marker at the current position while a fast is running.
  let head = null;
  if (progress > 0 && progress < 1) {
    const deg = START_ANGLE + SWEEP * progress;
    const p1 = polar(cx, cy, rOuter - HEAD_LEN, deg);
    const p2 = polar(cx, cy, rOuter + 1, deg);
    head = (
      <Line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={colors.ringHead}
        strokeWidth={HEAD_WIDTH}
        strokeLinecap="round"
      />
    );
  }

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {ticks}
        {head}
      </Svg>

      {/* Milestone icon chips, seated on the tick band */}
      {milestones.map(bp => {
        const deg = START_ANGLE + SWEEP * bp.frac;
        const reached = bp.frac <= progress + 1e-6;
        return (
          <MilestoneChip key={bp.effectCode} icon={bp.icon} reached={reached} cx={cx} cy={cy} r={rMarker} deg={deg} />
        );
      })}

      {/* Center content */}
      <View style={styles.center} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

export default React.memo(FastingRing);

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  markerReached: {
    borderColor: colors.ringHead,
    backgroundColor: colors.surface,
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
