import { StyleSheet, View } from 'react-native';

import Coffee from '../../../assets/icons/coffee.svg';
import History from '../../../assets/icons/history.svg';
import Legend from '../../../assets/icons/legend.svg';
import SoftButton from '../SoftButton';
import { colors } from '../../theme';

export type FooterProps = {
  onHistoryClick: () => void;
  onLegendClick: () => void;
  onBuyMeCoffeeClick: () => void;
};

const BUTTON_SIZE = 36;

export default function Footer(props: FooterProps) {
  return (
    <View style={styles.footer}>
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

const styles = StyleSheet.create({
  footer: {
    flex: 1,
    width: '80%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  icon: {
    margin: 14,
    color: colors.textPrimary,
  },
});
