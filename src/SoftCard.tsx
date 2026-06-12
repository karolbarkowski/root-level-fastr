import React, { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { Shadow } from 'react-native-shadow-2';
import { colors } from './theme';

interface Props {
  children?: ReactNode;
  /** Outermost wrapper — use for margins & flex sizing. */
  style?: StyleProp<ViewStyle>;
  /** Surface — use for padding, content alignment & explicit sizing. */
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  /** How far the card floats — drives the shadow offset. */
  distance?: number;
  /** Shadow softness / spread. */
  blur?: number;
  /** Stretch the surface to fill the cross-axis (full-width cards). */
  stretch?: boolean;
  surfaceColor?: string;
}

/**
 * A neumorphic raised surface. Two stacked SVG shadows (via react-native-shadow-2)
 * fake the soft-UI extruded look — a dark shadow bottom-right and a white highlight
 * top-left. Unlike RN's native `shadow*`/`elevation`, this renders identically on
 * iOS and Android.
 */
export default function SoftCard({
  children,
  style,
  contentStyle,
  radius = 20,
  distance = 4,
  blur = 12,
  stretch = false,
  surfaceColor = colors.surface,
}: Props) {
  const rounded = { borderRadius: radius };
  return (
    <Shadow
      distance={blur}
      startColor={colors.shadowDark}
      offset={[distance, distance]}
      stretch={stretch}
      safeRender
      containerStyle={style}
      style={rounded}
    >
      <Shadow
        distance={blur}
        startColor={colors.shadowLight}
        offset={[-distance, -distance]}
        stretch={stretch}
        safeRender
        style={[rounded, { backgroundColor: surfaceColor }, contentStyle]}
      >
        {children}
      </Shadow>
    </Shadow>
  );
}
