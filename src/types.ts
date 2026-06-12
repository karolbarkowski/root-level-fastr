import type { FC } from 'react';
import type { SvgProps } from 'react-native-svg';

export interface Breakpoint {
  /** Hours from the start of the fast at which this milestone occurs. */
  hoursIn: number;
  /** SVG component rendered as a marker chip on the ring. */
  icon: FC<SvgProps>;
  /** Reserved for future use (haptics / animations / notifications). */
  effectCode: string;
  /** Ring stroke color used from this point onwards. */
  colorCode: string;
}

export interface RingConfig {
  /** Color of the ring before the first breakpoint. */
  baseColor: string;
  /** Color used to grey-out the portion of the fast that already passed. */
  elapsedColor: string;
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
