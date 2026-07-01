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
  accent: '#ECECEC', // near-white; the only "loud" tone in the UI
  danger: '#D97B72',

  // Tick-gauge ring — dim ticks, white-lit progress.
  ringTrack: 'rgba(255,255,255,0.16)', // ticks not yet reached
  ringProgress: '#ECECEC', // ticks within the elapsed portion
  ringHead: '#FFFFFF', // brighter marker at the current position
};
