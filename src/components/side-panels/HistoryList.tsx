import Animated, {
  Easing,
  FadeInDown,
  LinearTransition,
  SlideOutRight,
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
import { appFont, colors } from '../../theme';

const HOUR_MS = 3600_000;

// Stagger the first few rows as the panel opens; later rows (below the fold)
// appear together so long histories don't take seconds to settle.
const STAGGER_MS = 40;
const STAGGER_LIMIT = 8;

// Selection indent / accent-bar width the row animates toward.
const SELECT_PAD = 14;
const SELECT_BORDER = 3;

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

interface RowProps {
  entry: FastEntry;
  index: number;
  frac: number;
  metTarget: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
}

/**
 * One fast: duration leads, an ember dot marks a met target, the bar below
 * scales against the longest fast. Selecting eases the row rightward behind
 * a growing accent bar; deletion slides it off to the right while the
 * remaining rows close the gap (layout transition).
 */
function HistoryRow({ entry, index, frac, metTarget, selected, onToggle }: RowProps) {
  const sel = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    sel.value = withTiming(selected ? 1 : 0, { duration: 180, easing: Easing.out(Easing.quad) });
  }, [selected, sel]);

  const selectStyle = useAnimatedStyle(() => ({
    paddingLeft: SELECT_PAD * sel.value,
    borderLeftWidth: SELECT_BORDER * sel.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(220).delay(Math.min(index, STAGGER_LIMIT) * STAGGER_MS)}
      exiting={SlideOutRight.duration(240)}
      layout={LinearTransition.duration(240)}
    >
      <Pressable onPress={() => onToggle(entry.id)}>
        <Animated.View style={[styles.row, selectStyle]}>
          <View style={styles.rowHeader}>
            <Text style={styles.duration}>{formatDurationShort(entry.endedAt - entry.startedAt)}</Text>
            {metTarget && <View style={styles.metDot} />}
            <Text style={styles.date}>{formatDateShort(entry.startedAt)}</Text>
          </View>
          <HistoryBar frac={frac} metTarget={metTarget} index={index} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

interface Props {
  entries: FastEntry[];
  /** Permanently remove the given entries from storage. */
  onDelete: (ids: string[]) => void;
}

/**
 * Fasting history: a pinned retention note above a scrolling list of rows,
 * with the "remove selected" action pinned below the list.
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
      {/* Pinned header — just the retention note; stats over a rolling
          30-fast window would be misleading. */}
      <View style={styles.header}>
        <Text style={styles.note}>Only the last {HISTORY_LIMIT} fasts are kept.</Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {entries.map((entry, i) => {
          const actualMs = entry.endedAt - entry.startedAt;
          return (
            <HistoryRow
              key={entry.id}
              entry={entry}
              index={i}
              frac={maxMs > 0 ? actualMs / maxMs : 0}
              metTarget={actualMs >= entry.targetHours * HOUR_MS}
              selected={selected.has(entry.id)}
              onToggle={toggle}
            />
          );
        })}
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
    fontFamily: appFont,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyHint: {
    fontFamily: appFont,
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },

  // Pinned header
  header: {
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.14)',
  },
  note: {
    fontFamily: appFont,
    color: colors.textSecondary,
    opacity: 0.7,
    fontSize: 11,
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // Rows
  list: {
    flex: 1,
  },
  row: {
    paddingVertical: 10,
    // Width/padding are animated from 0 on selection; only the color is static.
    borderLeftColor: colors.accent,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  duration: {
    fontFamily: appFont,
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
    fontFamily: appFont,
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

  removeRow: {
    paddingTop: 14,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
  removeText: {
    fontFamily: appFont,
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingVertical: 6,
  },
});
