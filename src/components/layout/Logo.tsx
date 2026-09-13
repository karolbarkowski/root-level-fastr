import { StyleSheet, View } from 'react-native';
import React from 'react';
import FastR from '../../../assets/fastr-symbol.svg';
import Wordmark from '../../../assets/fastr-wordmark.svg';

function Logo() {
  return (
    <View style={styles.container} accessible accessibilityRole="image" accessibilityLabel="FastR">
      <FastR width={36} height={28} />
      <Wordmark width={65} height={27} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 9 },
});
export default React.memo(Logo);
