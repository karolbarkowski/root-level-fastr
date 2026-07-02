import { Linking, StyleSheet, Text, View } from 'react-native';

import { BUY_ME_A_COFFEE_URL } from '../../config';
import CoffeeIcon from '../../../assets/icons/coffee.svg';
import React from 'react';
import SoftButton from '../SoftButton';
import { colors } from '../../theme';

const ICON_SIZE = 44;

export default function Coffee() {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <CoffeeIcon width={ICON_SIZE} height={ICON_SIZE} color={colors.textPrimary} />
      </View>

      <View>
        <Text style={styles.heading}>Enjoying FastR?</Text>
        <Text style={styles.body}>
          FastR is free, has no ads and no tracking — just a timer that stays out of your way. It's built and maintained
          by one person in their spare time.
        </Text>
        <Text style={styles.body}>
          If it helps you stick to your fasts, you can fuel the next update with a coffee. It genuinely makes a
          difference.
        </Text>
      </View>

      <View style={styles.buttonWrap}>
        <SoftButton onPress={() => Linking.openURL(BUY_ME_A_COFFEE_URL)} radius={22}>
          <Text style={styles.buttonLabel}>Buy me a coffee</Text>
        </SoftButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
  },
  iconWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  buttonWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
});
