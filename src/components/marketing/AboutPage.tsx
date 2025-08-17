import React from 'react';
import { Users, Target, Award, TrendingUp } from 'lucide-react';
import { PageProps } from '../../types/navigation';

const team = [
  {
    name: 'Leadership Team',
    role: 'Executive Leadership',
    bio: 'Our leadership team brings decades of combined experience from top-tier financial institutions and technology companies.',
    avatar: 'LT',
  },
  {
    name: 'Engineering Team',
    role: 'Technology & Development',
    bio: 'World-class engineers with expertise in real-time data processing, financial systems, and scalable platform architecture.',
    avatar: 'ET',
  },
  {
    name: 'Trading Experts',
    role: 'Market Intelligence',
    bio: 'Professional traders and quantitative analysts who ensure our algorithms detect the most relevant market opportunities.',
    avatar: 'TE',
  },
];

const stats = [
  { name: 'Active Traders', value: '25,000+' },
  { name: 'Alerts Sent Daily', value: '500,000+' },
  { name: 'Average Response Time', value: '<2 seconds' },
  { name: 'Uptime', value: '99.9%' },
];

export function AboutPage({ onNavigate }: PageProps) {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Built by Traders,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> For Traders</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              SnoopFlow was created by a team of former Wall Street professionals who understand 
              the critical importance of timing in options trading.
            </p>
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Our Mission</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Democratizing Institutional-Grade Options Intelligence
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              We believe every trader deserves access to the same high-quality market intelligence 
              that institutional investors use to make profitable decisions.
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Target className="h-8 w-8 flex-none text-blue-600" />
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <h3 className="font-semibold text-gray-900 mb-2">Precision</h3>
                  <p className="flex-auto">
                    Our algorithms filter out noise to show you only the options activity that truly matters, 
                    helping you focus on high-probability opportunities.
                  </p>
                </dd>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <TrendingUp className="h-8 w-8 flex-none text-blue-600" />
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <h3 className="font-semibold text-gray-900 mb-2">Performance</h3>
                  <p className="flex-auto">
                    Built for speed and reliability, our platform processes millions of options trades 
                    per second to deliver alerts in real-time.
                  </p>
                </dd>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Users className="h-8 w-8 flex-none text-blue-600" />
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <h3 className="font-semibold text-gray-900 mb-2">Community</h3>
                  <p className="flex-auto">
                    Join a community of professional traders who share insights, strategies, 
                    and market intelligence to help everyone succeed.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Trusted by Thousands of Traders
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Our platform processes massive amounts of market data to deliver actionable insights
              </p>
            </div>
            <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.name} className="flex flex-col bg-gray-400/5 p-8">
                  <dt className="text-sm font-semibold leading-6 text-gray-600">{stat.name}</dt>
                  <dd className="order-first text-3xl font-bold tracking-tight text-gray-900">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Meet Our Team
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Industry veterans with decades of combined experience in trading, technology, and financial markets.
            </p>
          </div>
          
          <ul
            role="list"
            className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3"
          >
            {team.map((person) => (
              <li key={person.name}>
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                    {person.avatar}
                  </div>
                  <h3 className="text-lg font-semibold leading-8 tracking-tight text-gray-900">
                    {person.name}
                  </h3>
                  <p className="text-base leading-7 text-blue-600 font-medium">{person.role}</p>
                  <p className="mt-4 text-base leading-7 text-gray-600">{person.bio}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Join Our Community?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Start your free trial today and see why thousands of traders trust SnoopFlow 
              for their options market intelligence.
            </p>
            <div className="mt-10">
              <button
                onClick={() => onNavigate('signup')}
                className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-gray-50 transition-all transform hover:scale-105"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}