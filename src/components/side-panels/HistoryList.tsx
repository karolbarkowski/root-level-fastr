import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { formatDateShort, formatDurationShort } from '../../utils/format';

import { FastEntry } from '../../types';
import { colors } from '../../theme';

const HOUR_MS = 3600_000;

// Stagger the first few rows as the panel opens; later rows (below the fold)
// appear together so long histories don't take seconds to settle.
const STAGGER_MS = 40;
const STAGGER_LIMIT = 8;

interface BarProps {
  /** Bar length as a fraction of the longest fast on record. */
  frac: number;
  /** Whether the fast reached its target duration. */
  metTarget: boolean;
  /** Row index, used to stagger the grow-in. */
  index: number;
}

/** A horizontal duration bar that grows from zero when the panel opens. */
function HistoryBar({ frac, metTarget, index }: BarProps) {
  const grow = useSharedValue(0);

  useEffect(() => {
    grow.value = withDelay(
      120 + Math.min(index, STAGGER_LIMIT) * STAGGER_MS,
      withTiming(Math.max(frac, 0.04), { duration: 450, easing: Easing.out(Easing.cubic) }),
    );
  }, [frac, grow, index]);

  const growStyle = useAnimatedStyle(() => ({ width: `${grow.value * 100}%` }));

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, !metTarget && styles.barFillShort, growStyle]} />
    </View>
  );
}

interface Props {
  entries: FastEntry[];
  /** Permanently remove the given entries from storage. */
  onDelete: (ids: string[]) => void;
}

/**
 * A minimal bar-chart history: one row per fast — date, a bar sized against
 * the longest fast on record, and the duration. Accent bars hit their target,
 * muted bars fell short.
 *
 * Tap a row to select it; once any rows are selected a "remove" button appears
 * to permanently delete them.
 */
export default function HistoryList({ entries, onDelete }: Props) {
  const maxMs = entries.reduce((m, e) => Math.max(m, e.endedAt - e.startedAt), 0);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Drop selections for rows that no longer exist (e.g. after a delete).
  useEffect(() => {
    setSelected(prev => {
      const ids = new Set(entries.map(e => e.id));
      const next = new Set([...prev].filter(id => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [entries]);

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const removeSelected = useCallback(() => {
    onDelete([...selected]);
    setSelected(new Set());
  }, [onDelete, selected]);

  return (
    <View style={styles.card}>
      {entries.length === 0 ? (
        <Text style={styles.empty}>No completed fasts yet.</Text>
      ) : (
        <>
          {entries.map((entry, i) => {
            const actualMs = entry.endedAt - entry.startedAt;
            const frac = maxMs > 0 ? actualMs / maxMs : 0;
            const metTarget = actualMs >= entry.targetHours * HOUR_MS;
            const isSelected = selected.has(entry.id);
            return (
              <Animated.View
                key={entry.id}
                entering={FadeInDown.duration(220).delay(Math.min(i, STAGGER_LIMIT) * STAGGER_MS)}
              >
                <Pressable
                  onPress={() => toggle(entry.id)}
                  style={[styles.row, isSelected && styles.rowSelected]}
                >
                  <Text style={styles.date}>{formatDateShort(entry.startedAt)}</Text>
                  <HistoryBar frac={frac} metTarget={metTarget} index={i} />
                  <Text style={styles.duration}>{formatDurationShort(actualMs)}</Text>
                </Pressable>
              </Animated.View>
            );
          })}

          {selected.size > 0 && (
            <Animated.View entering={FadeInDown.duration(160)} style={styles.removeRow}>
              <Pressable onPress={removeSelected} hitSlop={8}>
                <Text style={styles.removeText}>remove {selected.size} selected</Text>
              </Pressable>
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderRadius: 10,
    gap: 12,
  },
  rowSelected: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  date: {
    width: 48,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  duration: {
    width: 56,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  // Fasts that ended before reaching their target render muted.
  barFillShort: {
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  removeRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  removeText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingVertical: 6,
  },
});
