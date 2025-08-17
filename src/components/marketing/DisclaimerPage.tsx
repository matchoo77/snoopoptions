import React from 'react';
import { AlertTriangle, Shield, Info } from 'lucide-react';
import { PageProps } from '../../types/navigation';

export function DisclaimerPage({ onNavigate }: PageProps) {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <AlertTriangle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Risk Disclaimer
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Important information about options trading risks and SnoopFlow services
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  High Risk Investment Warning
                </h3>
                <p className="text-red-700 text-sm leading-relaxed">
                  Options trading involves substantial risk of loss and is not suitable for all investors. 
                  You may lose more than your initial investment. Past performance does not guarantee future results.
                </p>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">General Risk Disclosure</h2>
            <p className="text-gray-700 mb-4">
              Trading options involves significant financial risk. Options can expire worthless, resulting in a total loss 
              of the premium paid. The value of options can fluctuate rapidly due to changes in the underlying asset price, 
              time decay, implied volatility, and other market factors.
            </p>
            <p className="text-gray-700 mb-4">
              Before trading options, you should carefully consider your investment objectives, level of experience, 
              and risk tolerance. You should be aware of all the risks associated with options trading and seek advice 
              from an independent financial advisor if you have any doubts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">SnoopFlow Service Disclaimer</h2>
            <p className="text-gray-700 mb-4">
              SnoopFlow is a market data analysis and alerting service. We provide tools to identify unusual options 
              activity and market patterns. <strong>SnoopFlow does not provide investment advice, trading recommendations, 
              or financial planning services.</strong>
            </p>
            <p className="text-gray-700 mb-4">
              All information provided by SnoopFlow is for informational and educational purposes only. Users are solely 
              responsible for their own trading decisions and should conduct their own research and analysis before 
              making any investment decisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Accuracy and Reliability</h2>
            <p className="text-gray-700 mb-4">
              While we strive to provide accurate and timely market data, SnoopFlow cannot guarantee the accuracy, 
              completeness, or timeliness of any information provided. Market data may be delayed, and technical 
              issues may occasionally affect data delivery.
            </p>
            <p className="text-gray-700 mb-4">
              Users should not rely solely on SnoopFlow data for trading decisions and should verify information 
              through multiple sources before taking any trading action.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Guarantee of Profits</h2>
            <p className="text-gray-700 mb-4">
              SnoopFlow makes no representations or warranties regarding potential profits or losses from using our service. 
              Trading results vary widely among individuals, and many traders lose money. Success in trading requires 
              skill, knowledge, discipline, and favorable market conditions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Regulatory Compliance</h2>
            <p className="text-gray-700 mb-4">
              SnoopFlow is not a registered investment advisor, broker-dealer, or financial institution. We do not 
              provide personalized investment advice or manage client funds. Users are responsible for ensuring 
              their trading activities comply with all applicable laws and regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              MM Publishing Inc. and SnoopFlow shall not be liable for any direct, indirect, incidental, special, 
              or consequential damages arising from the use of our service, including but not limited to trading 
              losses, lost profits, or business interruption.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Educational Purpose</h2>
            <p className="text-gray-700 mb-4">
              SnoopFlow is designed as an educational and analytical tool to help users understand market dynamics 
              and unusual options activity patterns. It should be used as part of a comprehensive trading education 
              and risk management strategy.
            </p>
          </section>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <div className="flex items-start space-x-3">
              <Info className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Questions About Risk Management?
                </h3>
                <p className="text-blue-700 text-sm mb-3">
                  We encourage all users to educate themselves about options trading risks and develop 
                  appropriate risk management strategies.
                </p>
                <button
                  onClick={() => onNavigate('contact')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                >
                  Contact our support team →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}