import { Image, StyleSheet, View } from 'react-native';

import FastR from '../../../assets/fastr-symbol.svg';
import React from 'react';

function Logo() {
  return (
    <View style={styles.container}>
      <FastR width={80} height={80} />
      <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 120,
    height: 40,
  },
});

export default React.memo(Logo);
