import { StyleSheet, Text, View } from 'react-native';

import { DEFAULT_RING_CONFIG } from '../../config';
import React from 'react';
import { appFont, colors } from '../../theme';

const EFFECT_COPY: Record<string, { name: string; description: string }> = {
  bloodSugarDrop: {
    name: 'Blood Sugar Drop',
    description: 'Glucose levels fall as glycogen stores run low and the body starts switching fuel sources.',
  },
  fatBurning: {
    name: 'Fat Burning',
    description: 'With glycogen depleted, the body ramps up lipolysis — releasing fatty acids and producing ketones.',
  },
  autophagy: {
    name: 'Autophagy',
    description: 'Cells begin recycling damaged components, a self-cleaning process tied to repair and longevity.',
  },
  growthHormone: {
    name: 'Growth Hormone',
    description: 'Human growth hormone surges, helping preserve lean muscle and support tissue repair.',
  },
  insulinDrop: {
    name: 'Insulin Drop',
    description: 'Insulin falls to its lowest, sharply improving insulin sensitivity.',
  },
  immuneReset: {
    name: 'Immune Reset',
    description: 'Prolonged fasting prompts regeneration of white blood cells, refreshing the immune system.',
  },
};

const ICON_SIZE = 30;

export default function Legend() {
  return (
    <View>
      {DEFAULT_RING_CONFIG.breakpoints.map((bp, i) => {
        const copy = EFFECT_COPY[bp.effectCode];
        const Icon = bp.icon;
        return (
          // Plain Views: entering animations would fire while the panel is
          // parked off-screen (it stays mounted), and on Fabric they can
          // freeze the row at a bogus initial layout.
          <View key={bp.effectCode} style={[styles.row, i > 0 && styles.rowDivider]}>
            <View style={styles.iconWrap}>
              <Icon width={ICON_SIZE} height={ICON_SIZE} />
            </View>

            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={styles.name}>{copy?.name ?? bp.effectCode}</Text>
                <Text style={styles.hours}>{bp.hoursIn}h</Text>
              </View>
              {copy ? <Text style={styles.description}>{copy.description}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
  iconWrap: {
    width: ICON_SIZE + 8,
    alignItems: 'center',
    marginRight: 12,
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: appFont,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  hours: {
    fontFamily: appFont,
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
    marginLeft: 8,
  },
  description: {
    fontFamily: appFont,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 3,
  },
});
