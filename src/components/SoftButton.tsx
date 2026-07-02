import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { GestureResponderEvent, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import React, { ReactNode } from 'react';

import { colors } from '../theme';

interface Props {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  surfaceColor?: string;
  onPress?: (e: GestureResponderEvent) => void;
}

/**
 * A flat outlined button: a hairline circle (or pill) on the dark backdrop,
 * no fill, no shadows. Pressing scales the surface down briefly so the tap
 * still reads as physical.
 */
function SoftButton({ children, style, radius = 999, surfaceColor = 'transparent', onPress = () => {} }: Props) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      onPressIn={() => {
        scale.value = withTiming(0.92, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 260 });
      }}
    >
      <Animated.View
        style={[styles.surface, { borderRadius: radius, backgroundColor: surfaceColor }, style, pressStyle]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default React.memo(SoftButton);

const styles = StyleSheet.create({
  surface: {
    borderWidth: 1,
    borderColor: colors.outline,
  },
});
