import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { PanResponder, StyleSheet, View } from 'react-native';
import React, { useEffect, useRef } from 'react';

import { Shadow } from 'react-native-shadow-2';
import { colors } from '../theme';

interface Props {
  /** Current hour value (0–99). */
  value: number;
  /** Called with the new clamped integer value while dragging. */
  onChange: (value: number) => void;
  size?: number;
  /** Ignore drags (e.g. while a fast is running). */
  disabled?: boolean;
}

const MIN = 0;
const MAX = 99;
const DEGREES_PER_HOUR = 30; // a full 360° turn = 12 hours, like a clock

const DOT_RIM = 18;
const DOT_HOLE = 15;
const DOT_TOP = 5; // distance from the disc's top edge to the dot

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * A draggable neumorphic knob. Spinning it clockwise advances the value
 * (12 hours per full revolution); counter-clockwise rewinds it. A recessed
 * inset dot near the rim marks the current rotational position.
 *
 * Fully standalone — only React Native + react-native-shadow-2 + theme colors.
 */
function HoursDial({ value, onChange, size = 132, disabled = false }: Props) {
  const radius = size / 2;

  // PanResponder is created once, so reach live props/measurements via refs.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const disabledRef = useRef(disabled);
  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
    disabledRef.current = disabled;
  });

  const center = useRef({ x: 0, y: 0 });
  const drag = useRef({ lastAngle: 0, hours: 0 });

  // The disc swells slightly while grabbed, so the knob feels physical.
  const grabScale = useSharedValue(1);
  const grabStyle = useAnimatedStyle(() => ({ transform: [{ scale: grabScale.value }] }));

  const angleOf = (px: number, py: number) =>
    (Math.atan2(py - center.current.y, px - center.current.x) * 180) / Math.PI;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onPanResponderGrant: (_e, g) => {
        drag.current.lastAngle = angleOf(g.x0, g.y0);
        drag.current.hours = valueRef.current;
        grabScale.value = withTiming(1.03, { duration: 120 });
      },
      onPanResponderMove: (_e, g) => {
        const a = angleOf(g.moveX, g.moveY);
        let delta = a - drag.current.lastAngle;
        if (delta > 180) {
          delta -= 360;
        } else if (delta < -180) {
          delta += 360;
        }
        drag.current.lastAngle = a;
        drag.current.hours = clamp(drag.current.hours + delta / DEGREES_PER_HOUR, MIN, MAX);
        const next = Math.round(drag.current.hours);
        if (next !== valueRef.current) {
          onChangeRef.current(next);
        }
      },
      onPanResponderRelease: () => {
        grabScale.value = withSpring(1, { damping: 16, stiffness: 220 });
      },
      onPanResponderTerminate: () => {
        grabScale.value = withSpring(1, { damping: 16, stiffness: 220 });
      },
    }),
  ).current;

  const measureCenter = (ref: View | null) => {
    ref?.measureInWindow((x, y, w, h) => {
      center.current = { x: x + w / 2, y: y + h / 2 };
    });
  };

  const containerRef = useRef<View | null>(null);

  return (
    <Animated.View
      ref={(r: View | null) => {
        containerRef.current = r;
      }}
      style={[{ width: size, height: size }, grabStyle]}
      onLayout={() => measureCenter(containerRef.current)}
      {...pan.panHandlers}
    >
      <Shadow distance={16} startColor={colors.shadowDark} offset={[7, 8]} safeRender style={{ borderRadius: radius }}>
        <Shadow
          distance={16}
          startColor={colors.shadowLight}
          offset={[-8, -8]}
          safeRender
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: colors.surface,
          }}
        >
          {/* Rotating layer carrying the position dot */}
          <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${value * DEGREES_PER_HOUR}deg` }] }]}>
            <View style={[styles.dotRim, { top: DOT_TOP, left: (size - DOT_RIM) / 2 }]}>
              <View style={styles.dotHole} />
            </View>
          </View>
        </Shadow>
      </Shadow>
    </Animated.View>
  );
}

export default React.memo(HoursDial);

const styles = StyleSheet.create({
  // The rim is the lit bottom-right edge of the recess.
  dotRim: {
    position: 'absolute',
    width: DOT_RIM,
    height: DOT_RIM,
    borderRadius: DOT_RIM / 2,
    backgroundColor: colors.shadowLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The hole sits shifted up-left so the rim's light peeks at bottom-right,
  // selling the inset/recessed look.
  dotHole: {
    width: DOT_HOLE,
    height: DOT_HOLE,
    borderRadius: DOT_HOLE / 2,
    backgroundColor: colors.shadowDark,
    transform: [{ translateX: -1 }, { translateY: -1.5 }],
  },
});
