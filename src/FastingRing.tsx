import React, { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { RingConfig } from './types';

interface Props {
  size: number;
  strokeWidth?: number;
  /** Total length of the fast in hours (full ring sweep). */
  totalHours: number;
  /** Hours elapsed so far; the corresponding portion is greyed out. 0 when idle. */
  elapsedHours: number;
  config: RingConfig;
  /** Rendered centered inside the ring (START button / timer). */
  children?: ReactNode;
}

// Gauge geometry: 270° sweep with the gap at the bottom.
// t ∈ [0, 1] maps to screen angle 135° → 405°, clockwise.
const START_ANGLE = 135;
const SWEEP = 270;

function pointAt(cx: number, cy: number, r: number, t: number) {
  const rad = ((START_ANGLE + SWEEP * t) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, t0: number, t1: number) {
  const p0 = pointAt(cx, cy, r, t0);
  const p1 = pointAt(cx, cy, r, t1);
  const largeArc = (t1 - t0) * SWEEP > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArc} 1 ${p1.x} ${p1.y}`;
}

interface Segment {
  t0: number;
  t1: number;
  color: string;
}

const MARKER_SIZE = 36;

export default function FastingRing({
  size,
  strokeWidth = 12,
  totalHours,
  elapsedHours,
  config,
  children,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - MARKER_SIZE) / 2; // leave room for icon markers on the stroke

  const breakpoints = useMemo(
    () =>
      [...config.breakpoints]
        .filter(bp => bp.hoursIn > 0 && bp.hoursIn < totalHours)
        .sort((a, b) => a.hoursIn - b.hoursIn),
    [config.breakpoints, totalHours],
  );

  // Color segments: baseColor until the first breakpoint, then each
  // breakpoint's colorCode until the next one (or the end of the ring).
  const segments = useMemo<Segment[]>(() => {
    const out: Segment[] = [];
    let cursorT = 0;
    let color = config.baseColor;
    for (const bp of breakpoints) {
      const t = bp.hoursIn / totalHours;
      if (t > cursorT) {
        out.push({ t0: cursorT, t1: t, color });
      }
      cursorT = t;
      color = bp.colorCode;
    }
    out.push({ t0: cursorT, t1: 1, color });
    return out;
  }, [breakpoints, config.baseColor, totalHours]);

  const progressT = Math.min(Math.max(elapsedHours / totalHours, 0), 1);

  const startCap = pointAt(cx, cy, r, 0);
  const endCap = pointAt(cx, cy, r, 1);
  const headCap = pointAt(cx, cy, r, progressT);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Colored milestone segments */}
        {segments.map((seg, i) => (
          <Path
            key={`seg-${i}`}
            d={arcPath(cx, cy, r, seg.t0, seg.t1)}
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            fill="none"
          />
        ))}
        {/* Rounded ring ends */}
        <Circle
          cx={startCap.x}
          cy={startCap.y}
          r={strokeWidth / 2}
          fill={segments[0].color}
        />
        <Circle
          cx={endCap.x}
          cy={endCap.y}
          r={strokeWidth / 2}
          fill={segments[segments.length - 1].color}
        />
        {/* Grey overlay for elapsed time */}
        {progressT > 0 && (
          <>
            <Path
              d={arcPath(cx, cy, r, 0, progressT)}
              stroke={config.elapsedColor}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              fill="none"
            />
            <Circle
              cx={startCap.x}
              cy={startCap.y}
              r={strokeWidth / 2}
              fill={config.elapsedColor}
            />
            <Circle
              cx={headCap.x}
              cy={headCap.y}
              r={strokeWidth / 2}
              fill={config.elapsedColor}
            />
          </>
        )}
      </Svg>

      {/* Breakpoint icon markers (plain Views so emoji render reliably) */}
      {breakpoints.map((bp, i) => {
        const p = pointAt(cx, cy, r, bp.hoursIn / totalHours);
        return (
          <View
            key={`bp-${i}`}
            style={[
              styles.marker,
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
    shadowColor: '#9AA9C0',
    shadowOpacity: 0.55,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  markerIcon: {
    fontSize: 17,
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
