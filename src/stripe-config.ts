export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'subscription' | 'payment';
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    priceId: 'price_1S2uSi4gvT1xDWNkG6pBkAHO',
    name: 'SnoopFlow Annual',
    description: 'Full access to SnoopFlow for 1 year',
    mode: 'subscription'
  }
];