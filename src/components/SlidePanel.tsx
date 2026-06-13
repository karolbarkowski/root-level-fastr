import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import React, { ReactNode, useEffect, useState } from 'react';

import Close from '../../assets/icons/close.svg';
import SoftButton from './SoftButton';
import { colors } from '../theme';
import { scheduleOnRN } from 'react-native-worklets';

interface Props {
  visible: boolean;
  onClose: () => void;
  children?: ReactNode;
  /** Panel width as a fraction of the screen, capped at 420px. */
  widthRatio?: number;
}

const DURATION = 150;
const BUTTON_SIZE = 36;

/**
 * A reusable overlay panel that slides in from the right edge. Tapping the
 * dimmed backdrop or the "×" closes it. The surface mirrors the soft-UI app
 * style — rounded left corners and a light shadow cast toward the screen.
 *
 * Driven by Reanimated — the slide and fade run entirely on the UI thread.
 */
export default function SlidePanel({ visible, onClose, children, widthRatio = 0.82 }: Props) {
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width * widthRatio, 420);

  // One shared 0→1 value drives both the slide (translateX) and backdrop fade.
  const progress = useSharedValue(0);

  // Keep the panel mounted through its exit animation, then unmount.
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }
    progress.value = withTiming(
      visible ? 1 : 0,
      { duration: DURATION, easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic) },
      finished => {
        if (finished && !visible) {
          scheduleOnRN(setMounted, false);
        }
      },
    );
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [panelWidth, 0]) }],
  }));

  if (!mounted) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop — tap anywhere outside the panel to dismiss. */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.panel, { width: panelWidth }, panelStyle]}>
        <ScrollView style={styles.content}>{children}</ScrollView>

        <View style={styles.center}>
          <SoftButton onPress={onClose}>
            <Close style={styles.closeIcon} width={BUTTON_SIZE} height={BUTTON_SIZE} />
          </SoftButton>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(70, 85, 110, 0.28)',
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
    // Light shadow cast leftward onto the screen.
    shadowColor: colors.shadowDark,
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
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
