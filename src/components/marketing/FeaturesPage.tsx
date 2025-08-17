import React from 'react';
import { 
  Zap, 
  TrendingUp, 
  Shield, 
  Clock, 
  Filter, 
  Bell, 
  BarChart3, 
  Target,
  Eye,
  Smartphone,
  Globe,
  Lock
} from 'lucide-react';
import { PageProps } from '../../types/navigation';

const features = [
  {
    name: 'Real-Time Unusual Activity Detection',
    description: 'Advanced algorithms scan millions of options trades per second to identify unusual volume, premium, and institutional activity patterns.',
    icon: Zap,
  },
  {
    name: 'Block Trade Identification',
    description: 'Instantly spot large institutional trades and dark pool activity that could signal major market movements.',
    icon: Shield,
  },
  {
    name: 'Smart Alert System',
    description: 'Customizable notifications via browser, email, and mobile push notifications. Never miss a significant trade again.',
    icon: Bell,
  },
  {
    name: 'Advanced Filtering Engine',
    description: 'Filter by volume, premium, sentiment, days to expiration, Greeks, and dozens of other criteria to find exactly what you need.',
    icon: Filter,
  },
  {
    name: 'Live Market Data',
    description: 'Real-time options quotes, Greeks calculations, and market data powered by institutional-grade data feeds.',
    icon: BarChart3,
  },
  {
    name: 'Sentiment Analysis',
    description: 'AI-powered sentiment analysis determines whether unusual activity is bullish, bearish, or neutral.',
    icon: TrendingUp,
  },
  {
    name: 'Personal Watchlist',
    description: 'Track your favorite symbols and get instant alerts when unusual activity occurs in your watchlist.',
    icon: Eye,
  },
  {
    name: 'Historical Analysis',
    description: 'Access historical unusual activity data to backtest strategies and identify recurring patterns.',
    icon: Clock,
  },
  {
    name: 'Mobile Optimized',
    description: 'Fully responsive design works perfectly on desktop, tablet, and mobile devices. Trade from anywhere.',
    icon: Smartphone,
  },
  {
    name: 'Global Markets',
    description: 'Coverage of US equity options, ETF options, and index options across all major exchanges.',
    icon: Globe,
  },
  {
    name: 'Secure & Reliable',
    description: 'Bank-grade security with 99.9% uptime. Your data and trading strategies are always protected.',
    icon: Lock,
  },
  {
    name: 'Precision Targeting',
    description: 'Focus on specific sectors, market caps, or volatility ranges to match your trading style perfectly.',
    icon: Target,
  },
];

export function FeaturesPage({ onNavigate }: PageProps) {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Complete Feature Set</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything You Need to Trade Options Like a Pro
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            SnoopFlow provides institutional-grade tools and data to help you identify profitable 
            opportunities and make informed trading decisions.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <feature.icon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Feature Highlight */}
        <div className="mt-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl sm:text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                See It In Action
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Watch how SnoopFlow identifies unusual options activity in real-time
              </p>
            </div>
            
            <div className="mt-16 bg-gray-900 rounded-2xl p-8 shadow-2xl">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-green-400 text-sm font-mono">LIVE</div>
                </div>
                
                <div className="space-y-3 font-mono text-sm">
                  <div className="text-green-400">🚨 UNUSUAL ACTIVITY DETECTED</div>
                  <div className="text-white">TSLA 240216C00250000 | Volume: 15,847 | Premium: $2.3M</div>
                  <div className="text-blue-400">Block Trade: 5,000 contracts @ $4.60</div>
                  <div className="text-yellow-400">Sentiment: BULLISH | Delta: 0.65 | IV: 85%</div>
                  <div className="text-gray-400">Time: 14:23:15 EST</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 text-center">
          <button
            onClick={() => onNavigate('pricing')}
            className="rounded-md bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all transform hover:scale-105"
          >
            Start 7-Day Free Trial
          </button>
          <p className="mt-4 text-sm text-gray-600">
            No credit card required • Cancel anytime • 7-day free trial
          </p>
        </div>
      </div>
    </div>
  );
}