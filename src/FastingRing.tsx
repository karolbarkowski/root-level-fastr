import React, { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { RingConfig } from './types';
import { colors } from './theme';

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

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function FastingRing({
  size,
  totalHours,
  elapsedHours,
  config,
  children,
}: Props) {
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

  // Evenly spaced gauge ticks; the elapsed portion is "lit".
  const ticks = useMemo(() => {
    const out = [];
    for (let i = 0; i < TICK_COUNT; i++) {
      const t = i / (TICK_COUNT - 1);
      const deg = START_ANGLE + SWEEP * t;
      const lit = t <= progress + 1e-6;
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
  }, [cx, cy, rOuter, progress]);

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
      {milestones.map((bp, i) => {
        const deg = START_ANGLE + SWEEP * bp.frac;
        const p = polar(cx, cy, rMarker, deg);
        const reached = bp.frac <= progress + 1e-6;
        return (
          <View
            key={`bp-${i}`}
            style={[
              styles.marker,
              reached && styles.markerReached,
              { left: p.x - MARKER_SIZE / 2, top: p.y - MARKER_SIZE / 2 },
            ]}
          >
            <Text style={styles.markerIcon}>{bp.icon}</Text>
          </View>
        );
      })}

      {/* Center content */}
      <View style={styles.center} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: '#F4F7FB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#8294B0',
    shadowOpacity: 0.45,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  markerReached: {
    borderColor: colors.ringHead,
    backgroundColor: '#EAF6FD',
  },
  markerIcon: {
    fontSize: 15,
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
