import React, { useState } from 'react';
import { Navigation } from './Navigation';
import { HomePage } from './HomePage';
import { FeaturesPage } from './FeaturesPage';
import { PricingPage } from './PricingPage';
import { AboutPage } from './AboutPage';
import { ContactPage } from './ContactPage';
import { Footer } from './Footer';

interface MarketingAppProps {
  onLogin: () => void;
}

export function MarketingApp({ onLogin }: MarketingAppProps) {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} currentPage={currentPage} />;
      case 'features':
        return <FeaturesPage onNavigate={setCurrentPage} currentPage={currentPage} />;
      case 'pricing':
        return <PricingPage onNavigate={setCurrentPage} currentPage={currentPage} />;
      case 'about':
        return <AboutPage onNavigate={setCurrentPage} currentPage={currentPage} />;
      case 'contact':
        return <ContactPage onNavigate={setCurrentPage} currentPage={currentPage} />;
      default:
        return <HomePage onNavigate={setCurrentPage} currentPage={currentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        onLogin={onLogin}
      />
      <main className="pt-16">
        {renderPage()}
      </main>
      <Footer 
        onNavigate={setCurrentPage} 
        currentPage={currentPage}
        onLogin={onLogin}
      />
    </div>
  );
}