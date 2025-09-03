import React, { useState } from 'react';
import { Check, Loader2, CreditCard } from 'lucide-react';
import { StripeProduct } from '../../stripe-config';
import { createCheckoutSession } from '../../lib/stripe';

interface SubscriptionCardProps {
  product: StripeProduct;
  isCurrentPlan?: boolean;
  userToken: string;
}

export function SubscriptionCard({ product, isCurrentPlan = false, userToken }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    console.log('Subscribe button clicked for product:', product);
    
    setLoading(true);
    try {
      if (!userToken) {
        console.error('No user token available');
        alert('Please log in to subscribe');
        return;
      }
      
      console.log('Creating checkout session...');
      const { url } = await createCheckoutSession({
        priceId: product.priceId,
        mode: product.mode,
        userToken,
      });
      
      console.log('Checkout URL received:', url);
      if (url) {
        console.log('Redirecting to Stripe checkout...');
        window.location.href = url;
      } else {
        console.error('No checkout URL received');
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert(`Checkout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 border-2 ${
      isCurrentPlan ? 'border-green-500' : 'border-gray-200'
    }`}>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        <div className="mb-4">
          <span className="text-3xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {product.interval && (
            <span className="text-gray-600">
              /{product.interval === 'year' ? 'year' : 'month'}
            </span>
          )}
        </div>
        <p className="text-gray-600 mb-6">
          {product.description}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-3" />
          <span className="text-gray-700">Real-time unusual options alerts</span>
        </div>
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-3" />
          <span className="text-gray-700">Advanced filtering capabilities</span>
        </div>
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-3" />
          <span className="text-gray-700">Block trade notifications</span>
        </div>
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-3" />
          <span className="text-gray-700">Premium support</span>
        </div>
        {product.interval === 'year' && (
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-gray-700">Save $245 annually</span>
          </div>
        )}
      </div>

      <button
        onClick={handleSubscribe}
        disabled={loading || isCurrentPlan}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center ${
          isCurrentPlan
            ? 'bg-green-100 text-green-800 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Subscribe Now
          </>
        )}
      </button>
    </div>
  );
}