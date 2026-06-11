import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatDay, formatDurationShort, formatTime } from './format';
import { FastEntry } from './types';

interface Props {
  entries: FastEntry[];
}

export default function HistoryList({ entries }: Props) {
  if (entries.length === 0) {
    return <Text style={styles.empty}>No completed fasts yet.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>History</Text>
      {entries.map(entry => {
        const actualMs = entry.endedAt - entry.startedAt;
        const targetMs = entry.targetHours * 3600_000;
        const reached = actualMs >= targetMs;
        return (
          <View key={entry.id} style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>
                {formatDay(entry.startedAt)}, {formatTime(entry.startedAt)} →{' '}
                {formatDay(entry.endedAt)}, {formatTime(entry.endedAt)}
              </Text>
              <Text style={styles.rowSub}>
                {formatDurationShort(actualMs)} of {entry.targetHours}h target
              </Text>
            </View>
            <Text style={styles.rowBadge}>{reached ? '✅' : '🏳️'}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 6,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  empty: {
    color: '#8E8E93',
    fontSize: 14,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  rowLeft: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  rowSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  rowBadge: {
    fontSize: 16,
    marginLeft: 8,
  },
});
