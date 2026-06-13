import Animated, { FadeInDown } from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import { formatDay, formatDurationShort, formatTime } from '../../utils/format';

import { FastEntry } from '../../types';
import React from 'react';
import { colors } from '../../theme';

// Stagger the first few rows as the panel opens; later rows (below the fold)
// appear together so long histories don't take seconds to settle.
const STAGGER_MS = 40;
const STAGGER_LIMIT = 8;

interface Props {
  entries: FastEntry[];
}

export default function HistoryList({ entries }: Props) {
  // Bars are sized relative to the longest fast on record, so the list reads
  // comparatively at a glance.
  const maxMs = entries.reduce((m, e) => Math.max(m, e.endedAt - e.startedAt), 0);

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>History</Text>

      {entries.length === 0 ? (
        <Text style={styles.empty}>No completed fasts yet.</Text>
      ) : (
        entries.map((entry, i) => {
          const actualMs = entry.endedAt - entry.startedAt;
          const frac = maxMs > 0 ? actualMs / maxMs : 0;
          return (
            <Animated.View
              key={entry.id}
              entering={FadeInDown.duration(220).delay(Math.min(i, STAGGER_LIMIT) * STAGGER_MS)}
              style={[styles.row, i > 0 && styles.rowDivider]}
            >
              <Text style={styles.date} numberOfLines={1}>
                {formatDay(entry.startedAt)}, {formatTime(entry.startedAt)}
              </Text>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.duration}>{formatDurationShort(actualMs)}</Text>

              <View style={styles.spacer} />

              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.max(frac * 100, 6)}%` }]} />
              </View>
            </Animated.View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  heading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 2,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(120,140,170,0.22)',
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  arrow: {
    fontSize: 13,
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
  duration: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  spacer: {
    flex: 1,
    minWidth: 12,
  },
  barTrack: {
    width: 56,
    height: 4,
    alignItems: 'flex-end',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
});
