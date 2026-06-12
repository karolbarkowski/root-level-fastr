import { GestureResponderEvent, Pressable, StyleProp, ViewStyle } from 'react-native';
import React, { ReactNode } from 'react';

import { Shadow } from 'react-native-shadow-2';
import { colors } from './theme';

interface Props {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  distance?: number;
  blur?: number;
  stretch?: boolean;
  surfaceColor?: string;
  onPress?: (e: GestureResponderEvent) => void;
}

/**
 * A neumorphic raised surface. Two stacked SVG shadows (via react-native-shadow-2)
 * fake the soft-UI extruded look — a dark shadow bottom-right and a white highlight
 * top-left. Unlike RN's native `shadow*`/`elevation`, this renders identically on
 * iOS and Android.
 */
export default function SoftButton({
  children,
  style,
  radius = 999,
  distance = 4,
  blur = 12,
  stretch = false,
  surfaceColor = colors.surface,
  onPress = () => {},
}: Props) {
  const rounded = { borderRadius: radius };
  return (
    <Pressable onPress={onPress}>
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
          style={[rounded, { backgroundColor: surfaceColor }]}
        >
          {children}
        </Shadow>
      </Shadow>
    </Pressable>
  );
}
