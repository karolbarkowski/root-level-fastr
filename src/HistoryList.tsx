import { StyleSheet, Text, View } from 'react-native';
import { formatDay, formatTime } from './format';

import { FastEntry } from './types';
import React from 'react';
import { colors } from './theme';

interface Props {
  entries: FastEntry[];
}

export default function HistoryList({ entries }: Props) {
  // Bars are sized relative to the longest fast on record, so the list reads
  // comparatively at a glance.
  const maxMs = entries.reduce(
    (m, e) => Math.max(m, e.endedAt - e.startedAt),
    0,
  );

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>History</Text>

      {entries.length === 0 ? (
        <Text style={styles.empty}>No completed fasts yet.</Text>
      ) : (
        entries.map((entry, i) => {
          const actualMs = entry.endedAt - entry.startedAt;
          const frac = maxMs > 0 ? actualMs / maxMs : 0;
          const totalMin = Math.max(0, Math.floor(actualMs / 60000));
          const durationLabel = `${Math.floor(totalMin / 60)}h ${
            totalMin % 60
          }m`;
          return (
            <View
              key={entry.id}
              style={[styles.row, i > 0 && styles.rowDivider]}
            >
              <Text style={styles.date} numberOfLines={1}>
                {formatDay(entry.startedAt)}, {formatTime(entry.startedAt)}
              </Text>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.duration}>{durationLabel}</Text>

              <View style={styles.spacer} />

              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.max(frac * 100, 6)}%` },
                  ]}
                />
              </View>
            </View>
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
  cardContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
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
