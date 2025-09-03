import React from 'react';
import { ArrowRight, TrendingUp, Zap, Shield, Clock, CheckCircle, Star } from 'lucide-react';
import { PageProps } from '../../types/navigation';

export function HomePage({ onNavigate }: PageProps) {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-600 to-purple-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>
        
        <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Your Trading Dog is on the Hunt 🐕
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600"> Sniffing Out Big Moves</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              SnoopFlow is your loyal trading companion that sniffs out unusual options activity, 
              tracks down block trades, and helps you follow the scent of profitable opportunities.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={() => onNavigate('signup')}
                className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all transform hover:scale-105"
              >
                Get Started
              </button>
              <button
                onClick={() => onNavigate('features')}
                className="text-sm font-semibold leading-6 text-gray-900 flex items-center hover:text-blue-600 transition-colors"
              >
                Learn more <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Professional Options Intelligence
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Everything you need to identify and act on unusual options activity in real-time.
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Zap className="h-5 w-5 flex-none text-orange-600" />
                  Lightning-Fast Sniffing
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Our trading dog's nose detects unusual options activity instantly. Get alerts 
                    the moment big trades happen - faster than you can say "woof!"
                  </p>
                </dd>
              </div>
              
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <TrendingUp className="h-5 w-5 flex-none text-orange-600" />
                  Trained to Hunt
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Like a well-trained hunting dog, SnoopFlow knows exactly what to look for. 
                    Filter by volume, premium, sentiment, and more to track down your perfect trades.
                  </p>
                </dd>
              </div>
              
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Shield className="h-5 w-5 flex-none text-orange-600" />
                  Following the Big Dogs
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Follow the scent of institutional money! Our dog tracks where the big players 
                    are making moves so you can follow the pack leaders.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Trusted by Professional Traders
            </h2>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:max-w-xl sm:grid-cols-2 sm:gap-x-10 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-4">
            <div className="col-span-2 max-h-12 w-full object-contain lg:col-span-1 bg-gray-100 rounded-lg p-4 flex items-center justify-center">
              <span className="text-gray-600 font-semibold">Hedge Fund Partners</span>
            </div>
            <div className="col-span-2 max-h-12 w-full object-contain lg:col-span-1 bg-gray-100 rounded-lg p-4 flex items-center justify-center">
              <span className="text-gray-600 font-semibold">Day Traders Pro</span>
            </div>
            <div className="col-span-2 max-h-12 w-full object-contain lg:col-span-1 bg-gray-100 rounded-lg p-4 flex items-center justify-center">
              <span className="text-gray-600 font-semibold">Options Academy</span>
            </div>
            <div className="col-span-2 max-h-12 w-full object-contain lg:col-span-1 bg-gray-100 rounded-lg p-4 flex items-center justify-center">
              <span className="text-gray-600 font-semibold">Trading Elite</span>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              What Our Users Say
            </h2>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 grid-rows-1 gap-8 text-sm leading-6 text-gray-900 sm:mt-20 sm:grid-cols-2 xl:mx-0 xl:max-w-none xl:grid-flow-col xl:grid-cols-3">
            <figure className="col-span-1 bg-white rounded-2xl shadow-lg ring-1 ring-gray-900/5 p-8">
              <blockquote className="text-gray-900">
                <p>
                  "SnoopFlow helped me identify a massive Tesla options play 30 minutes before the stock moved 8%. 
                  The real-time alerts are game-changing for my trading strategy."
                </p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div>
                  <div className="font-semibold">Mike Chen</div>
                  <div className="text-gray-600">Professional Day Trader</div>
                </div>
              </figcaption>
            </figure>
            
            <figure className="col-span-1 bg-white rounded-2xl shadow-lg ring-1 ring-gray-900/5 p-8">
              <blockquote className="text-gray-900">
                <p>
                  "The block trade detection is incredible. I can see exactly where institutional money is flowing 
                  and position myself accordingly. My win rate has improved significantly."
                </p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div>
                  <div className="font-semibold">Sarah Rodriguez</div>
                  <div className="text-gray-600">Options Specialist</div>
                </div>
              </figcaption>
            </figure>
            
            <figure className="col-span-1 bg-white rounded-2xl shadow-lg ring-1 ring-gray-900/5 p-8">
              <blockquote className="text-gray-900">
                <p>
                  "Finally, a scanner that actually works. The filtering system lets me focus on exactly 
                  the type of trades I'm looking for. Worth every penny."
                </p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  D
                </div>
                <div>
                  <div className="font-semibold">David Kim</div>
                  <div className="text-gray-600">Hedge Fund Manager</div>
                </div>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Level Up Your Trading?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Join thousands of traders who use SnoopFlow to identify profitable opportunities 
              and stay ahead of market movements.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={() => onNavigate('signup')}
                className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all transform hover:scale-105"
              >
                Start Your Free Trial
              </button>
              <button
                onClick={() => onNavigate('features')}
                className="text-sm font-semibold leading-6 text-white flex items-center hover:text-blue-100 transition-colors"
              >
                View Features <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
