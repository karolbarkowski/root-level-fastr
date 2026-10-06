import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { DonationProduct, loadDonationProducts, purchaseDonation } from '../../utils/donations';
import React, { useEffect, useState } from 'react';
import { appFont, colors } from '../../theme';

import CoffeeIcon from '../../../assets/icons/coffee.svg';
import { DONATION_TIERS } from '../../config';

const ICON_SIZE = 44;

type Status = { kind: 'loading' } | { kind: 'ready' } | { kind: 'unavailable' };

export default function Coffee() {
  const [products, setProducts] = useState<DonationProduct[]>([]);
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadDonationProducts(DONATION_TIERS.map(tier => tier.productId))
      .then(list => {
        if (alive) {
          setProducts(list);
          setStatus({ kind: list.length ? 'ready' : 'unavailable' });
        }
      })
      .catch(() => alive && setStatus({ kind: 'unavailable' }));
    return () => {
      alive = false;
    };
  }, []);

  const buy = async (productId: string) => {
    setBuying(productId);
    setMessage(null);
    try {
      const outcome = await purchaseDonation(productId);
      if (outcome === 'purchased') {
        setMessage('Thank you so much! ☕');
      } else if (outcome === 'pending') {
        setMessage('Thanks! Your payment is pending and will go through once it completes.');
      }
    } catch {
      setMessage('Something went wrong with the payment. Please try again.');
    } finally {
      setBuying(null);
    }
  };

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
          If it helps you stick to your fasts, you can fuel the next update with a coffee.
        </Text>
        <Text style={styles.body}>It genuinely makes a difference.</Text>
      </View>

      <View style={styles.buttonWrap}>
        {status.kind === 'loading' && <ActivityIndicator color={colors.accent} />}
        {status.kind === 'unavailable' && <Text style={styles.body}>Tips aren't available on this device right now.</Text>}
        {status.kind === 'ready' &&
          products.map(product => (
            <TipButton
              key={product.id}
              label={DONATION_TIERS.find(tier => tier.productId === product.id)?.label ?? product.id}
              price={product.price}
              busy={buying === product.id}
              disabled={buying !== null}
              onPress={() => buy(product.id)}
            />
          ))}
        {message && <Text style={[styles.body, styles.message]}>{message}</Text>}
      </View>
    </View>
  );
}

type TipButtonProps = { label: string; price: string; busy: boolean; disabled: boolean; onPress: () => void };

function TipButton({ label, price, busy, disabled, onPress }: TipButtonProps) {
  // Pressing scales the button down briefly so the tap reads as physical.
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${price}`}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      onPressIn={() => {
        scale.value = withTiming(0.92, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
    >
      <Animated.View style={[styles.button, disabled && !busy && styles.buttonDimmed, pressStyle]}>
        <Text style={styles.buttonLabel}>{label}</Text>
        {busy ? <ActivityIndicator color={colors.accent} /> : <Text style={styles.buttonPrice}>{price}</Text>}
      </Animated.View>
    </Pressable>
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
    fontFamily: appFont,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontFamily: appFont,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    marginTop: 4,
    color: colors.textPrimary,
  },
  buttonWrap: {
    alignItems: 'stretch',
    marginTop: 12,
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonDimmed: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontFamily: appFont,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  buttonPrice: {
    fontFamily: appFont,
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
});
