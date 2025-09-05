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
    priceId: 'price_1S3JL7LH6uJIp2yEMCAcNUi9',
    name: 'SnoopFlow Annual',
    description: 'Full access to SnoopFlow for 1 year',
    mode: 'subscription',
    currency: 'USD',
    price: 399,
    interval: 'year'
  }
];

// Hardcoded Stripe live publishable key for reliable checkout
export const STRIPE_PUBLISHABLE_KEY = 'pk_live_51S3IrFLH6uJIp2yEmxwQi2f2cuGdB76bW9MzHhPqmrm6xr5C9WxHHVyRVgZ1EoJqTuLIwuecr7mH4LMBzx63zNDH00AFYBey1y';