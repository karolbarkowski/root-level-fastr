import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActiveFast, FastEntry } from './types';

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

export async function saveHistory(entries: FastEntry[]): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
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
  await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(fast));
}

export async function clearActiveFast(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_KEY);
}
