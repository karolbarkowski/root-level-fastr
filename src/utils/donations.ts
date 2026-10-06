import { NativeModules, Platform } from 'react-native';

export type DonationProduct = { id: string; price: string; priceMicros: number };
export type PurchaseOutcome = 'purchased' | 'pending' | 'cancelled';

type DonationsModule = {
  getProducts(ids: string[]): Promise<DonationProduct[]>;
  purchase(productId: string): Promise<PurchaseOutcome>;
};

/** Google Play Billing is Android-only; elsewhere donations are simply unavailable. */
const donations = Platform.OS === 'android' ? (NativeModules.Donations as DonationsModule | undefined) : undefined;

export async function loadDonationProducts(ids: string[]): Promise<DonationProduct[]> {
  if (!donations) {
    return [];
  }
  const products = await donations.getProducts(ids);
  return products.sort((a, b) => a.priceMicros - b.priceMicros);
}

export function purchaseDonation(productId: string): Promise<PurchaseOutcome> {
  if (!donations) {
    return Promise.reject(new Error('Donations are not available on this device'));
  }
  return donations.purchase(productId);
}
