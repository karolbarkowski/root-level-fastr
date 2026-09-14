import { NativeModules, Platform } from 'react-native';
import type { ActiveFast } from '../types';

/** Only a small local snapshot is mirrored to Android; the app owns fast history. */
export async function syncFastWidget(fast: ActiveFast | null): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  const widget = NativeModules.FastWidget as { update(startedAt: number, endsAt: number): Promise<void> } | undefined;
  if (!widget) {
    return;
  }
  try {
    await widget.update(fast?.startedAt ?? 0, fast ? fast.startedAt + fast.targetHours * 3600000 : 0);
  } catch (error) {
    console.warn('FastR widget could not refresh', error);
  }
}
