import type { FC } from 'react';
import type { SvgProps } from 'react-native-svg';

export interface Breakpoint {
  /** Hours from the start of the fast at which this milestone occurs. */
  hoursIn: number;
  /** SVG component rendered as a marker chip on the ring. */
  icon: FC<SvgProps>;
  /** Stable id; keys the chip and looks up the legend copy. */
  effectCode: string;
}

export interface RingConfig {
  breakpoints: Breakpoint[];
}

export interface FastEntry {
  id: string;
  startedAt: number; // epoch ms
  endedAt: number; // epoch ms
  targetHours: number;
}

export interface ActiveFast {
  startedAt: number; // epoch ms
  targetHours: number;
}
