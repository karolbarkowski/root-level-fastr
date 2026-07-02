import { Image, StyleSheet, View } from 'react-native';

import FastR from '../../../assets/fastr-symbol.svg';
import React from 'react';

interface Props {
  /** Symbol only, no wordmark — for narrow spots like the landscape rail. */
  compact?: boolean;
}

function Logo({ compact = false }: Props) {
  if (compact) {
    return <FastR width={56} height={56} color="#8C8C8C" />;
  }

  return (
    <View style={styles.container}>
      <FastR width={80} height={80} color="#8C8C8C" />
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
    // The wordmark PNG is dark; tint it light for the dark backdrop.
    tintColor: '#D8D8D8',
  },
});

export default React.memo(Logo);
