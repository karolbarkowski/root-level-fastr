import { G, Polygon, Svg } from 'react-native-svg';

type Segment = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';

const SEGMENTS: Record<Segment, string> = {
  a: '14,4 18,0 62,0 66,4 62,8 18,8',
  b: '66,10 70,14 70,44 66,48 62,44 62,14',
  c: '66,52 70,56 70,86 66,90 62,86 62,56',
  d: '14,92 18,88 62,88 66,92 62,96 18,96',
  e: '10,52 14,56 14,86 10,90 6,86 6,56',
  f: '10,10 14,14 14,44 10,48 6,44 6,14',
  g: '14,48 18,44 62,44 66,48 62,52 18,52',
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

export const SevenSegmentDigit = ({
  digit,
  x = 0,
  activeColor,
  inactiveColor,
}: SevenSegmentDigitProps) => {
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
  activeColor?: string;
  inactiveColor?: string;
  width?: number;
  height?: number;
}

export default function DigitalDisplay({
  value,
  activeColor = '#C66E3D',
  inactiveColor = '#d2d7de',
  width = 180,
  height = 100,
}: Props) {
  const number = Math.max(0, Math.min(99, Math.floor(value)));

  const tens = Math.floor(number / 10);
  const ones = number % 10;

  return (
    <Svg width={width} height={height} viewBox="0 0 160 100">
      <SevenSegmentDigit
        digit={tens}
        x={0}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
      />

      <SevenSegmentDigit
        digit={ones}
        x={84}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
      />
    </Svg>
  );
}
