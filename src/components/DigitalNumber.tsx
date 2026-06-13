import { G, Polygon, Svg } from 'react-native-svg';

import React from 'react';

import { colors } from '../theme';

type Segment = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';

// Seven-segment geometry. Each segment is a tapered hexagon; bump HALF to make
// the segments chunkier (gaps shrink accordingly).
const HALF = 5; // half the segment thickness
const TAPER = 7; // length of the angled tip
const XL = 10; // left vertical centerline
const XR = 60; // right vertical centerline
const YT = 7; // top horizontal centerline
const YM = 48; // middle horizontal centerline
const YB = 89; // bottom horizontal centerline

const poly = (...pts: [number, number][]) => pts.map(([x, y]) => `${x},${y}`).join(' ');

// Horizontal bar centered on y, spanning XL → XR.
const horiz = (y: number) =>
  poly(
    [XL, y],
    [XL + TAPER, y - HALF],
    [XR - TAPER, y - HALF],
    [XR, y],
    [XR - TAPER, y + HALF],
    [XL + TAPER, y + HALF],
  );

// Vertical bar centered on x, spanning y0 → y1.
const vert = (x: number, y0: number, y1: number) =>
  poly(
    [x, y0],
    [x + HALF, y0 + TAPER],
    [x + HALF, y1 - TAPER],
    [x, y1],
    [x - HALF, y1 - TAPER],
    [x - HALF, y0 + TAPER],
  );

const SEGMENTS: Record<Segment, string> = {
  a: horiz(YT),
  b: vert(XR, YT, YM),
  c: vert(XR, YM, YB),
  d: horiz(YB),
  e: vert(XL, YM, YB),
  f: vert(XL, YT, YM),
  g: horiz(YM),
};

const DIGITS: Record<number, Segment[]> = {
  0: ['a', 'b', 'c', 'd', 'e', 'f'],
  1: ['b', 'c'],
  2: ['a', 'b', 'g', 'e', 'd'],
  3: ['a', 'b', 'g', 'c', 'd'],
  4: ['f', 'g', 'b', 'c'],
  5: ['a', 'f', 'g', 'c', 'd'],
  6: ['a', 'f', 'g', 'e', 'c', 'd'],
  7: ['a', 'b', 'c'],
  8: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  9: ['a', 'b', 'c', 'd', 'f', 'g'],
};

interface SevenSegmentDigitProps {
  digit: number;
  x?: number;
  activeColor: string;
  inactiveColor: string;
}

export const SevenSegmentDigit = ({ digit, x = 0, activeColor, inactiveColor }: SevenSegmentDigitProps) => {
  const active = DIGITS[digit];

  return (
    <G translateX={x}>
      {(Object.keys(SEGMENTS) as Segment[]).map(segment => (
        <Polygon
          key={segment}
          points={SEGMENTS[segment]}
          fill={active.includes(segment) ? activeColor : inactiveColor}
        />
      ))}
    </G>
  );
};

interface Props {
  value: number;
  width?: number;
  height?: number;
}

function DigitalDisplay({ value, width = 180, height = 100 }: Props) {
  const number = Math.max(0, Math.min(99, Math.floor(value)));
  const inactiveColor = '#dde0e6';

  const tens = Math.floor(number / 10);
  const ones = number % 10;

  return (
    <Svg width={width} height={height} viewBox="0 0 140 100">
      <SevenSegmentDigit digit={tens} x={0} activeColor={colors.accent} inactiveColor={inactiveColor} />

      <SevenSegmentDigit digit={ones} x={70} activeColor={colors.accent} inactiveColor={inactiveColor} />
    </Svg>
  );
}

export default React.memo(DigitalDisplay);
