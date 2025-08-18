import React from 'react';
import { Shield, Eye, Lock, Database } from 'lucide-react';
import { PageProps } from '../../types/navigation';

export function PrivacyPage({ onNavigate }: PageProps) {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            How we collect, use, and protect your information
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: January 17, 2025
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-700 mb-4">
              MM Publishing Inc. ("we," "our," or "us") operates SnoopFlow, a market data analysis platform. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
              you use our service.
            </p>
          </section>

          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Database className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Email address (for account creation and communication)</li>
              <li>Password (encrypted and securely stored)</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Usage data and preferences</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>IP address and location data</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Usage patterns and feature interactions</li>
              <li>Log data and error reports</li>
            </ul>
          </section>

          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Eye className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
            </div>
            
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Service Delivery:</strong> To provide and maintain SnoopFlow services</li>
              <li><strong>Account Management:</strong> To create and manage your user account</li>
              <li><strong>Communication:</strong> To send service updates, alerts, and support messages</li>
              <li><strong>Payment Processing:</strong> To process subscriptions and handle billing</li>
              <li><strong>Improvement:</strong> To analyze usage patterns and improve our services</li>
              <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security threats</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Lock className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Data Protection and Security</h2>
            </div>
            
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures to protect your personal information:
            </p>
            
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>End-to-end encryption for data transmission</li>
              <li>Secure password hashing using industry standards</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and employee training</li>
              <li>Secure cloud infrastructure with SOC 2 compliance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information Sharing</h2>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share 
              your information only in the following circumstances:
            </p>
            
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li><strong>Service Providers:</strong> With trusted third-party services (Stripe for payments, Supabase for data storage)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>
            <p className="text-gray-700 mb-4">
              SnoopFlow uses cookies and similar technologies to:
            </p>
            
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Maintain your login session</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns to improve our service</li>
              <li>Provide personalized content and features</li>
            </ul>
            
            <p className="text-gray-700 mb-4">
              You can control cookie settings through your browser preferences. However, disabling cookies 
              may affect the functionality of our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights and Choices</h2>
            <p className="text-gray-700 mb-4">
              You have the following rights regarding your personal information:
            </p>
            
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            
            <p className="text-gray-700 mb-4">
              To exercise these rights, please contact us at privacy@snoopflow.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your personal information for as long as necessary to provide our services and comply 
              with legal obligations. Account data is typically retained for:
            </p>
            
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>Active accounts: Duration of service use</li>
              <li>Inactive accounts: Up to 2 years after last activity</li>
              <li>Payment records: 7 years for tax and legal compliance</li>
              <li>Usage logs: 90 days for security and performance analysis</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              SnoopFlow integrates with the following third-party services:
            </p>
            
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li><strong>Stripe:</strong> Payment processing (subject to Stripe's privacy policy)</li>
              <li><strong>Supabase:</strong> Database and authentication services</li>
              <li><strong>Polygon.io:</strong> Market data provider</li>
            </ul>
            
            <p className="text-gray-700 mb-4">
              These services have their own privacy policies and data handling practices. We encourage 
              you to review their policies as well.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">International Users</h2>
            <p className="text-gray-700 mb-4">
              SnoopFlow is operated from the United States. If you are accessing our service from outside 
              the US, please be aware that your information may be transferred to, stored, and processed 
              in the United States where our servers are located.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              SnoopFlow is not intended for use by individuals under the age of 18. We do not knowingly 
              collect personal information from children under 18. If we become aware that we have collected 
              personal information from a child under 18, we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material 
              changes by posting the new Privacy Policy on this page and updating the "Last updated" date. 
              Your continued use of SnoopFlow after any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 mb-2"><strong>MM Publishing Inc.</strong></p>
              <p className="text-gray-700 mb-1">Email: matt@mmpublishinginc.net</p>
              <p className="text-gray-700">Support: matt@mmpublishinginc.net</p>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => onNavigate('home')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}