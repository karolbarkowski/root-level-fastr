import { StyleSheet, View } from 'react-native';

import React from 'react';

import Coffee from '../../../assets/icons/coffee.svg';
import History from '../../../assets/icons/history.svg';
import Legend from '../../../assets/icons/legend.svg';
import SoftButton from '../SoftButton';
import { colors } from '../../theme';

export type FooterProps = {
  onHistoryClick: () => void;
  onLegendClick: () => void;
  onBuyMeCoffeeClick: () => void;
  /** Stack the buttons in a column — for the landscape side rail. */
  vertical?: boolean;
};

const BUTTON_SIZE = 36;

function Footer(props: FooterProps) {
  return (
    <View style={[styles.footer, props.vertical && styles.footerVertical]}>
      <SoftButton onPress={props.onBuyMeCoffeeClick}>
        <Coffee style={styles.icon} width={BUTTON_SIZE} height={BUTTON_SIZE} />
      </SoftButton>

      <SoftButton onPress={props.onHistoryClick}>
        <History style={styles.icon} width={BUTTON_SIZE} height={BUTTON_SIZE} />
      </SoftButton>

      <SoftButton onPress={props.onLegendClick}>
        <Legend style={styles.icon} width={BUTTON_SIZE} height={BUTTON_SIZE} />
      </SoftButton>
    </View>
  );
}

export default React.memo(Footer);

const styles = StyleSheet.create({
  footer: {
    width: '80%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerVertical: {
    width: 'auto',
    flexDirection: 'column',
    gap: 28,
  },
  icon: {
    margin: 14,
    color: colors.textPrimary,
  },
});
