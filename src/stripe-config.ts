export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
  interval?: 'month' | 'year';
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_SysDPjI2j3M41J',
    priceId: 'price_1S2uSi4gvT1xDWNkG6pBkAHO', // You need to provide the price ID from Stripe dashboard
    name: 'SnoopFlow Annual',
    description: 'Get access to real-time unusual options activity alerts and advanced filtering capabilities.',
    mode: 'subscription',
    price: 399.00,
    currency: 'usd',
    interval: 'year',
  },
];

// Stripe live public key
export const STRIPE_PUBLISHABLE_KEY = 'pk_live_4NBJWxSyaJOvcK9vpK9xbMEa';

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
}

export function getProductById(id: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find(product => product.id === id);
}
