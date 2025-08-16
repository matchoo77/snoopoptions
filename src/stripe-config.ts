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
    id: 'prod_SsbPo4VmaAziVi',
    priceId: 'mmpub-snoopoptions',
    name: 'SnoopOptions Scanner - Monthly',
    description: 'Get access to real-time unusual options activity alerts and advanced filtering capabilities.',
    mode: 'subscription',
    price: 37.00,
    currency: 'usd',
    interval: 'month',
  },
  {
    id: 'prod_Ssba0qfTE4uTF8',
    priceId: 'price_1RwqMw4gvT1xDWNkhMDFhQvU',
    name: 'SnoopOptions Scanner - Annual',
    description: 'Get access to real-time unusual options activity alerts and advanced filtering capabilities with annual savings.',
    mode: 'subscription',
    price: 199.00,
    currency: 'usd',
    interval: 'year',
  },
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
}

export function getProductById(id: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find(product => product.id === id);
}