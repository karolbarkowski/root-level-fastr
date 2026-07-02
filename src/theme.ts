import { Platform } from 'react-native';

/**
 * Base font for all Text. Pinned to Roboto ('sans-serif') on Android because
 * OEM replacement system fonts (MIUI's MiSans and similar) render synthesized
 * bold wider than React Native measures it, clipping trailing characters
 * ("Autophagy" → "Autophag", "16h" → "16").
 */
export const appFont = Platform.select({ android: 'sans-serif' });

/**
 * Flat dark palette.
 *
 * Near-black backdrop, hairline outlines and light-gray type — hierarchy
 * comes from tone and thin strokes, never from shadows or elevation.
 */
export const colors = {
  bg: '#2B2B2B', // charcoal backdrop
  surface: '#333333', // panels / raised-but-flat surfaces
  outline: '#5A5A5A', // 1px strokes on buttons, chips, discs
  textPrimary: '#D8D8D8',
  textSecondary: '#8C8C8C',
  accent: '#FF6B1A', // ember orange — position markers, lit digits, met targets
  accentSoft: 'rgba(255,107,26,0.12)', // tinted fills (selected rows etc.)
  danger: '#D97B72',

  // Tick-gauge ring — dim ticks, white-lit progress, ember head.
  ringTrack: 'rgba(255,255,255,0.16)', // ticks not yet reached
  ringProgress: '#ECECEC', // ticks within the elapsed portion
  ringHead: '#FF6B1A', // marker at the current position
};
