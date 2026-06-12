import { Image, StyleSheet, View } from 'react-native';

export default function Logo() {
  return (
    <View style={styles.header}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    alignItems: 'center',
    marginTop: 68,
  },
  logo: {
    width: 120,
    height: 120 * (159 / 612),
  },
});
