import { ActiveFast, FastEntry } from '../types';

import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'fasting:history';
const ACTIVE_KEY = 'fasting:active';

export async function loadHistory(): Promise<FastEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as FastEntry[]) : [];
  } catch {
    return [];
  }
}

// Save functions swallow failures: callers fire-and-forget, and a failed
// write must not surface as an unhandled rejection (state stays usable,
// it just won't survive a restart).
export async function saveHistory(entries: FastEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {}
}

export async function loadActiveFast(): Promise<ActiveFast | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_KEY);
    return raw ? (JSON.parse(raw) as ActiveFast) : null;
  } catch {
    return null;
  }
}

export async function saveActiveFast(fast: ActiveFast): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(fast));
  } catch {}
}

export async function clearActiveFast(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACTIVE_KEY);
  } catch {}
}
