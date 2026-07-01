import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import React, { ReactNode, useEffect } from 'react';
import { scheduleOnRN } from 'react-native-worklets';

// TEMP DEBUG — remove after the stuck-slide investigation.
function logAnimDone(target: string, finished: boolean, value: number) {
  console.log(`[SlidePanel] ${target} done: finished=${finished} progress=${value.toFixed(3)}`);
}

import Close from '../../assets/icons/close.svg';
import SoftButton from './SoftButton';
import { colors } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  children?: ReactNode;
  /** Panel width as a fraction of the screen, capped at 420px. */
  widthRatio?: number;
}

const OPEN_DURATION = 240;
const CLOSE_DURATION = 160;
const BUTTON_SIZE = 36;

/**
 * A reusable overlay panel that slides in from the right edge. Tapping the
 * dimmed backdrop or the "×" closes it.
 *
 * The overlay stays mounted permanently (parked off-screen when closed) so
 * no React commit — SVG shadow measurement, entering animations, clock-tick
 * re-renders — lands inside the subtree while the slide is running. Commits
 * mid-animation interrupt Reanimated's UI-thread timing on Fabric, which is
 * what made the panel stall partway in.
 */
function SlidePanel({ visible, onClose, children, widthRatio = 0.82 }: Props) {
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width * widthRatio, 420);

  // One shared 0→1 value drives both the slide (translateX) and backdrop fade.
  const progress = useSharedValue(0);

  useEffect(() => {
    const target = visible ? 'open' : 'close';
    console.log(`[SlidePanel] ${target} start`);
    progress.value = withTiming(
      visible ? 1 : 0,
      {
        duration: visible ? OPEN_DURATION : CLOSE_DURATION,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      },
      finished => {
        scheduleOnRN(logAnimDone, target, finished ?? false, progress.value);
      },
    );
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [panelWidth, 0]) }],
  }));

  // Content trails the panel slightly and fades in late, giving the surface
  // a layered, parallax feel instead of sliding in as one rigid block.
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.4, 1], [0, 1]),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [36, 0]) }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'box-none' : 'none'}>
      {/* Backdrop — tap anywhere outside the panel to dismiss. */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.panel, { width: panelWidth }, panelStyle]}>
        <Animated.View style={[styles.content, contentStyle]}>
          <ScrollView>{children}</ScrollView>
        </Animated.View>

        <View style={styles.center}>
          <SoftButton onPress={onClose}>
            <Close style={styles.closeIcon} width={BUTTON_SIZE} height={BUTTON_SIZE} />
          </SoftButton>
        </View>
      </Animated.View>
    </View>
  );
}

export default React.memo(SlidePanel);

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  panel: {
    position: 'absolute',
    top: 60,
    right: 0,
    bottom: 60,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: colors.outline,
  },
  closeIcon: {
    margin: 14,
    color: colors.textPrimary,
  },
  center: {
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
});
