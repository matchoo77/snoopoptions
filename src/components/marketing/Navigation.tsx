import React, { useState } from 'react';
import { Menu, X, LogIn } from 'lucide-react';
import { NavigationItem } from '../../types/navigation';
import { DogIcon } from '../DogIcon';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogin: () => void;
}

const navigation: NavigationItem[] = [
  { name: 'Home', href: 'home' },
  { name: 'Features', href: 'features' },
  { name: 'Pricing', href: 'pricing' },
  { name: 'About', href: 'about' },
  { name: 'Contact', href: 'contact' },
];

export function Navigation({ currentPage, onNavigate, onLogin }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm fixed w-full top-0 z-50">
      <nav className="mx-auto max-w-7xl px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between border-b border-gray-200 py-6 lg:border-none">
          <div className="flex items-center">
            <button onClick={() => onNavigate('home')} className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                <DogIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">SnoopFlow</span>
                <p className="text-xs text-gray-500">🐕 Sniffing Out Options</p>
              </div>
            </button>
          </div>
          
          <div className="ml-10 hidden space-x-8 lg:block">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => onNavigate(item.href)}
                className={`text-base font-medium transition-colors ${
                  currentPage === item.href
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
          
          <div className="ml-6 flex items-center space-x-4">
            <button
              onClick={onLogin}
              className="hidden lg:flex items-center space-x-2 bg-blue-600 px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            
            <div className="flex lg:hidden">
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-x-6 pb-6 lg:hidden">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => onNavigate(item.href)}
              className={`text-sm font-medium transition-colors ${
                currentPage === item.href
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50">
            <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
              <div className="flex items-center justify-between">
                <button onClick={() => onNavigate('home')} className="flex items-center space-x-2">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                    <DogIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">SnoopFlow</span>
                </button>
                <button
                  type="button"
                  className="-m-2.5 rounded-md p-2.5 text-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-500/10">
                  <div className="space-y-2 py-6">
                    {navigation.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => {
                          onNavigate(item.href);
                          setMobileMenuOpen(false);
                        }}
                        className={`block rounded-lg px-3 py-2 text-base font-semibold leading-7 w-full text-left transition-colors ${
                          currentPage === item.href
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                  <div className="py-6">
                    <button
                      onClick={() => {
                        onLogin();
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}