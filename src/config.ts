import { RingConfig } from './types';

/**
 * Default fasting milestones, roughly matching the screenshot.
 * Tweak freely — the ring re-renders purely from this config.
 */
export const DEFAULT_RING_CONFIG: RingConfig = {
  baseColor: '#6BC9F2', // light blue before the first milestone
  elapsedColor: '#D2D2D8', // grey overlay for time already passed
  breakpoints: [
    { hoursIn: 12, icon: '🩸', effectCode: 'bloodSugarDrop', colorCode: '#D8362A' },
    { hoursIn: 14, icon: '🔥', effectCode: 'fatBurning', colorCode: '#D8362A' },
    { hoursIn: 16, icon: '♻️', effectCode: 'autophagy', colorCode: '#D8362A' },
    { hoursIn: 48, icon: '💪', effectCode: 'growthHormone', colorCode: '#D8362A' },
    { hoursIn: 56, icon: '📉', effectCode: 'insulinDrop', colorCode: '#D8362A' },
    { hoursIn: 72, icon: '🦠', effectCode: 'immuneReset', colorCode: '#E4E4E9' },
  ],
};

export const DEFAULT_TARGET_HOURS = 16;
export const MIN_TARGET_HOURS = 1;
export const MAX_TARGET_HOURS = 168;
