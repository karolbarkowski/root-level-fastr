import { Image, StyleSheet } from 'react-native';

import React from 'react';

function Logo() {
  return <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />;
}

export default React.memo(Logo);

const styles = StyleSheet.create({
  logo: {
    width: 120,
    height: 120 * (159 / 612),
  },
});
