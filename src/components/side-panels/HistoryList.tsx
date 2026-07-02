import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { formatDateShort, formatDurationShort } from '../../utils/format';

import { FastEntry } from '../../types';
import { HISTORY_LIMIT } from '../../config';
import HistoryIcon from '../../../assets/icons/history.svg';
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
 * Fasting history: a pinned stats strip (count / average / best) above a
 * scrolling list of rows — the duration leads, an ember dot marks fasts that
 * hit their target, and a bar scales each fast against the longest on record.
 *
 * Tap a row to select it (accent left border + indent); the pinned "remove"
 * button below the list permanently deletes the selection.
 */
export default function HistoryList({ entries, onDelete }: Props) {
  const maxMs = entries.reduce((m, e) => Math.max(m, e.endedAt - e.startedAt), 0);
  const totalMs = entries.reduce((sum, e) => sum + (e.endedAt - e.startedAt), 0);
  const avgMs = entries.length > 0 ? totalMs / entries.length : 0;

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

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <HistoryIcon width={44} height={44} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>No fasts yet</Text>
        <Text style={styles.emptyHint}>Completed fasts will show up here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Pinned stats strip */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{entries.length}</Text>
          <Text style={styles.statLabel}>FASTS</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDurationShort(avgMs)}</Text>
          <Text style={styles.statLabel}>AVERAGE</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDurationShort(maxMs)}</Text>
          <Text style={styles.statLabel}>BEST</Text>
        </View>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
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
              <Pressable onPress={() => toggle(entry.id)} style={[styles.row, isSelected && styles.rowSelected]}>
                <View style={styles.rowHeader}>
                  <Text style={styles.duration}>{formatDurationShort(actualMs)}</Text>
                  {metTarget && <View style={styles.metDot} />}
                  <Text style={styles.date}>{formatDateShort(entry.startedAt)}</Text>
                </View>
                <HistoryBar frac={frac} metTarget={metTarget} index={i} />
              </Pressable>
            </Animated.View>
          );
        })}

        <Text style={styles.note}>Only the last {HISTORY_LIMIT} fasts are kept.</Text>
      </ScrollView>

      {/* Pinned below the list so it never scrolls out of reach. */}
      {selected.size > 0 && (
        <Animated.View entering={FadeInDown.duration(160)} style={styles.removeRow}>
          <Pressable onPress={removeSelected} hitSlop={8}>
            <Text style={styles.removeText}>remove {selected.size} selected</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  emptyIcon: {
    color: colors.textSecondary,
    opacity: 0.5,
    marginBottom: 14,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },

  // Stats strip
  stats: {
    flexDirection: 'row',
    paddingBottom: 16,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.14)',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 3,
  },

  // Rows
  list: {
    flex: 1,
  },
  row: {
    paddingVertical: 10,
  },
  // Selection reads as an indented row pinned by an accent bar on the left.
  rowSelected: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    paddingLeft: 14,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  duration: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  // Small ember dot marking fasts that reached their target.
  metDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginLeft: 8,
  },
  date: {
    color: colors.textSecondary,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    marginLeft: 'auto',
  },
  barTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2.5,
    backgroundColor: colors.accent,
  },
  // Fasts that ended before reaching their target render muted.
  barFillShort: {
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  note: {
    color: colors.textSecondary,
    opacity: 0.7,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  removeRow: {
    paddingTop: 14,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
  removeText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingVertical: 6,
  },
});
