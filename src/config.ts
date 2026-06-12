import Autophagy from '../assets/icons/autophagy.svg';
import BloodSugarDrop from '../assets/icons/bloodSugarDrop.svg';
import FatBurning from '../assets/icons/fatBurning.svg';
import GrowthHormone from '../assets/icons/growthHormone.svg';
import ImmuneReset from '../assets/icons/immuneReset.svg';
import InsulinDrop from '../assets/icons/insulinDrop.svg';
import { RingConfig } from './types';

/**
 * Default fasting milestones, roughly matching the screenshot.
 * Tweak freely — the ring re-renders purely from this config.
 */
export const DEFAULT_RING_CONFIG: RingConfig = {
  baseColor: '#6BC9F2', // light blue before the first milestone
  elapsedColor: '#D2D2D8', // grey overlay for time already passed
  breakpoints: [
    {
      hoursIn: 12,
      icon: BloodSugarDrop,
      effectCode: 'bloodSugarDrop',
      colorCode: '#D8362A',
    },
    {
      hoursIn: 14,
      icon: FatBurning,
      effectCode: 'fatBurning',
      colorCode: '#D8362A',
    },
    {
      hoursIn: 16,
      icon: Autophagy,
      effectCode: 'autophagy',
      colorCode: '#D8362A',
    },
    {
      hoursIn: 48,
      icon: GrowthHormone,
      effectCode: 'growthHormone',
      colorCode: '#D8362A',
    },
    {
      hoursIn: 56,
      icon: InsulinDrop,
      effectCode: 'insulinDrop',
      colorCode: '#D8362A',
    },
    {
      hoursIn: 72,
      icon: ImmuneReset,
      effectCode: 'immuneReset',
      colorCode: '#E4E4E9',
    },
  ],
};

export const DEFAULT_TARGET_HOURS = 16;
