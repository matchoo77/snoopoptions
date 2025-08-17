import React from 'react';
import { Twitter, Linkedin, Github } from 'lucide-react';
import { PageProps } from '../../types/navigation';
import { DogIcon } from '../DogIcon';

interface FooterProps extends PageProps {
  onLogin: () => void;
}

const navigation = {
  product: [
    { name: 'Features', href: 'features' },
    { name: 'Pricing', href: 'pricing' },
    { name: 'Integrations', href: '#' },
  ],
  company: [
    { name: 'About', href: 'about' },
    { name: 'Blog', href: '#' },
    { name: 'Press', href: '#' },
  ],
  support: [
    { name: 'Contact', href: 'contact' },
    { name: 'Help Center', href: '#' },
    { name: 'Status', href: '#' },
    { name: 'Community', href: '#' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Risk Disclaimer', href: 'disclaimer' },
  ],
};

export function Footer({ onNavigate, onLogin }: FooterProps) {
  return (
    <footer className="bg-gray-900" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                <DogIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">SnoopFlow</span>
                <p className="text-xs text-gray-400">🐕 Sniffing Out Options</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-gray-300">
              Your loyal trading companion that sniffs out unusual options activity and helps you 
              track down profitable opportunities in real-time.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <Linkedin className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <Github className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Product</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.product.map((item) => (
                    <li key={item.name}>
                      <button
                        onClick={() => onNavigate(item.href)}
                        className="text-sm leading-6 text-gray-300 hover:text-white transition-colors text-left"
                      >
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Company</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.company.map((item) => (
                    <li key={item.name}>
                      <button
                        onClick={() => onNavigate(item.href)}
                        className="text-sm leading-6 text-gray-300 hover:text-white transition-colors text-left"
                      >
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Support</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.support.map((item) => (
                    <li key={item.name}>
                      <button
                        onClick={() => onNavigate(item.href)}
                        className="text-sm leading-6 text-gray-300 hover:text-white transition-colors text-left"
                      >
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Legal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      {item.href === '#' ? (
                        <a href={item.href} className="text-sm leading-6 text-gray-300 hover:text-white transition-colors">
                          {item.name}
                        </a>
                      ) : item.name === 'Privacy Policy' ? (
                        <button
                          onClick={() => onNavigate('privacy')}
                          className="text-sm leading-6 text-gray-300 hover:text-white transition-colors text-left"
                        >
                          {item.name}
                        </button>
                      ) : (
                        <button
                          onClick={() => onNavigate(item.href)}
                          className="text-sm leading-6 text-gray-300 hover:text-white transition-colors text-left"
                        >
                          {item.name}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 border-t border-gray-900/10 pt-8 sm:mt-20 lg:mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-gray-400">
              &copy; 2025 MM Publishing Inc. All rights reserved.
            </p>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={onLogin}
                className="text-xs leading-5 text-gray-400 hover:text-white transition-colors"
              >
                Trader Login →
              </button>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-800 pt-8">
            <p className="text-xs text-gray-500 text-center">
              <strong>Risk Disclaimer:</strong> Options trading involves substantial risk and is not suitable for all investors. 
              Past performance does not guarantee future results. SnoopFlow provides market data and analysis tools only - 
              not investment advice. Please consult with a financial advisor before making trading decisions.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}