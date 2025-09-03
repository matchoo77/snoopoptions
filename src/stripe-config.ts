export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'subscription' | 'payment';
  currency: string;
  price: number;
  interval?: 'month' | 'year';
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    priceId: 'price_1S2uSi4gvT1xDWNkG6pBkAHO',
    name: 'SnoopFlow Annual',
    description: 'Full access to SnoopFlow for 1 year',
    mode: 'subscription',
    currency: 'USD',
    price: 99,
    interval: 'year'
  }
];