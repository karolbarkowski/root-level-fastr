/**
 * Soft-UI ("neumorphic") palette.
 *
 * Surfaces sit only a touch lighter than the background and rely on paired
 * shadows — a dark one bottom-right, a white highlight top-left — to look
 * extruded from the screen. See {@link ./SoftCard}.
 */
export const colors = {
  bg: '#D8E1EA', // soft periwinkle backdrop
  surface: '#EAF0F8', // raised card / button face
  shadowDark: '#B7C3D8', // bottom-right drop shadow
  shadowLight: '#f3f6fa', // top-left highlight
  textPrimary: '#808B98',
  textSecondary: '#bdc3d3',
  accent: '#46a2cd',

  // Tick-gauge ring — pastel, blended into the background.
  ringTrack: 'rgba(120,140,170,0.28)', // ticks not yet reached
  ringProgress: '#9AD4F0', // ticks within the elapsed portion
  ringHead: '#5BC2F0', // brighter marker at the current position
  ringMilestone: 'rgba(118,138,170,0.55)', // landmark ticks at milestones
};
