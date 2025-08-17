import React from 'react';
import { Check, Star, Zap } from 'lucide-react';
import { PageProps } from '../../types/navigation';

const plans = [
  {
    name: 'Starter',
    id: 'starter',
    price: 37,
    interval: 'month',
    description: 'Perfect for individual traders getting started with options scanning.',
    features: [
      'Real-time unusual activity alerts',
      'Basic filtering capabilities',
      'Up to 5 watchlist symbols',
      'Email notifications',
      'Mobile-responsive dashboard',
      'Community support',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    id: 'professional',
    price: 199,
    interval: 'year',
    originalPrice: 444,
    description: 'Advanced features for serious traders and professionals.',
    features: [
      'Everything in Starter',
      'Advanced filtering & Greeks analysis',
      'Unlimited watchlist symbols',
      'Block trade detection',
      'Custom alert thresholds',
      'Historical data access',
      'Priority support',
      'API access',
      'Export capabilities',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
];

export function PricingPage({ onNavigate }: PageProps) {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose Your Trading Edge
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Start with a 7-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>
        
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-8 ring-1 xl:p-10 ${
                plan.popular
                  ? 'bg-gray-900 ring-gray-900 relative'
                  : 'bg-white ring-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    <Star className="w-4 h-4 fill-current" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  className={`text-lg font-semibold leading-8 ${
                    plan.popular ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {plan.name}
                </h3>
              </div>
              
              <p
                className={`mt-4 text-sm leading-6 ${
                  plan.popular ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {plan.description}
              </p>
              
              <p className="mt-6 flex items-baseline gap-x-1">
                <span
                  className={`text-4xl font-bold tracking-tight ${
                    plan.popular ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  ${plan.price}
                </span>
                <span
                  className={`text-sm font-semibold leading-6 ${
                    plan.popular ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  /{plan.interval}
                </span>
              </p>
              
              {plan.originalPrice && (
                <p className="mt-2 flex items-center gap-x-2">
                  <span className="text-sm text-gray-500 line-through">
                    ${plan.originalPrice}/year
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Save 55%
                  </span>
                </p>
              )}
              
              <button
                onClick={() => onNavigate('pricing')}
                className={`mt-10 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all transform hover:scale-105 ${
                  plan.popular
                    ? 'bg-white text-gray-900 hover:bg-gray-100 focus-visible:outline-white'
                    : 'bg-blue-600 text-white shadow-sm hover:bg-blue-500 focus-visible:outline-blue-600'
                }`}
              >
                {plan.cta}
              </button>
              
              <ul
                role="list"
                className={`mt-8 space-y-3 text-sm leading-6 ${
                  plan.popular ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check
                      className={`h-6 w-5 flex-none ${
                        plan.popular ? 'text-white' : 'text-blue-600'
                      }`}
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="mx-auto mt-16 max-w-4xl">
            <dl className="space-y-8">
              <div>
                <dt className="text-lg font-semibold leading-7 text-gray-900">
                  What makes SnoopFlow different from other options scanners?
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  SnoopFlow uses advanced algorithms to detect truly unusual activity, not just high volume. 
                  We analyze volume relative to open interest, premium size, and institutional trading patterns 
                  to identify trades that actually matter.
                </dd>
              </div>
              
              <div>
                <dt className="text-lg font-semibold leading-7 text-gray-900">
                  How fast are the alerts?
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Our alerts are delivered within seconds of unusual activity occurring. We use real-time 
                  WebSocket connections to major exchanges to ensure you get the fastest possible notifications.
                </dd>
              </div>
              
              <div>
                <dt className="text-lg font-semibold leading-7 text-gray-900">
                  Can I cancel my subscription anytime?
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Yes, you can cancel your subscription at any time. There are no long-term contracts or 
                  cancellation fees. Your access will continue until the end of your current billing period.
                </dd>
              </div>
              
              <div>
                <dt className="text-lg font-semibold leading-7 text-gray-900">
                  Do you offer a free trial?
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Yes! We offer a 7-day free trial with full access to all features. No credit card required 
                  to start your trial.
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Start Trading Smarter?</h3>
            <p className="text-blue-100 mb-6">
              Join thousands of traders who rely on SnoopFlow for their options intelligence
            </p>
            <button
              onClick={() => onNavigate('pricing')}
              className="bg-white text-blue-600 px-8 py-3 rounded-md font-semibold hover:bg-gray-50 transition-all transform hover:scale-105"
            >
              Start Your Free Trial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}