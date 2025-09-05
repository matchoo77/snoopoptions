 
import { Check, Star } from 'lucide-react';
import { PageProps } from '../../types/navigation';
import { STRIPE_PRODUCTS } from '../../stripe-config';

export function PricingPage({ onNavigate }: PageProps) {
  const annualPlan = STRIPE_PRODUCTS.find((p) => p.interval === 'year');

  return (
    <div className="bg-white">
      <div className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-600 to-purple-700 opacity-95" />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center text-white">
            <h2 className="text-base font-semibold leading-7 text-blue-100">Pricing</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              One Plan. Everything You Need.
            </p>
            <p className="mt-6 text-lg leading-8 text-blue-100">
              Annual access to professional options intelligence. Cancel anytime.
            </p>
          </div>
        </div>
      </div>

      {annualPlan && (
        <div className="mx-auto max-w-7xl px-6 lg:px-8 -mt-16 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-start-1 lg:col-end-4">
              <div className="relative bg-white rounded-3xl shadow-2xl ring-1 ring-gray-200 p-8 sm:p-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                    <Star className="w-4 h-4" />
                    <span>Best Value</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900">SnoopFlow Annual</h3>
                    <p className="mt-2 text-gray-600">
                      Full access for 12 months. All features. Priority support.
                    </p>
                    <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <li className="flex items-center text-sm text-gray-700"><Check className="w-5 h-5 text-green-600 mr-2" /> Real-time unusual options alerts</li>
                      <li className="flex items-center text-sm text-gray-700"><Check className="w-5 h-5 text-green-600 mr-2" /> Advanced filtering & analytics</li>
                      <li className="flex items-center text-sm text-gray-700"><Check className="w-5 h-5 text-green-600 mr-2" /> Block trade detection</li>
                      <li className="flex items-center text-sm text-gray-700"><Check className="w-5 h-5 text-green-600 mr-2" /> Priority support</li>
                    </ul>
                  </div>

                  <div className="shrink-0 text-center md:text-right">
                    <div className="text-gray-500 text-sm">Annual price</div>
                    <div className="mt-1 flex items-baseline justify-center md:justify-end gap-2">
                      <span className="text-5xl font-bold text-gray-900">${annualPlan.price}</span>
                      <span className="text-gray-500">/year</span>
                    </div>
                    <button onClick={() => onNavigate('signup')} className="mt-6 inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                      Start Annual Plan
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Secure payments by Stripe</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="pb-24">
        <div className="mx-auto max-w-2xl text-center px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="mx-auto mt-12 max-w-4xl px-6 lg:px-8">
          <dl className="space-y-8">
            <div>
              <dt className="text-lg font-semibold leading-7 text-gray-900">
                Do you offer monthly billing?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                We're focused on a single annual plan to keep pricing simple and deliver maximum value. Cancel anytime.
              </dd>
            </div>
            <div>
              <dt className="text-lg font-semibold leading-7 text-gray-900">
                Can I cancel my subscription anytime?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Yes. Your access continues until the end of your billing period.
              </dd>
            </div>
            <div>
              <dt className="text-lg font-semibold leading-7 text-gray-900">
                Do you offer a free trial?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                We occasionally run promotions. Create an account to get notified.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
