import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, TrendingUp, Award } from 'lucide-react';
import { PageProps } from '../../types/navigation';

export function ContactPage({ onNavigate }: PageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the form data to your backend
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="bg-white">
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-7xl py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Get in Touch
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Have questions about SnoopFlow? We're here to help you succeed in options trading.
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-16 lg:max-w-none lg:grid-cols-2">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Let's Talk About Your Trading Goals
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Our team of trading professionals is ready to help you maximize your options trading potential.
              </p>
              
              <dl className="mt-10 space-y-4 text-base leading-7 text-gray-600">
                <div className="flex gap-x-4">
                  <dt className="flex-none">
                    <Mail className="h-7 w-6 text-blue-600" aria-hidden="true" />
                  </dt>
                  <dd>
                    <a className="hover:text-gray-900" href="mailto:support@snoopflow.com">
                      support@snoopflow.com
                    </a>
                  </dd>
                </div>
                <div className="flex gap-x-4">
                  <dt className="flex-none">
                    <Phone className="h-7 w-6 text-blue-600" aria-hidden="true" />
                  </dt>
                  <dd>
                    <a className="hover:text-gray-900" href="tel:+1-555-SNOOP-01">
                      +1 (555) SNOOP-01
                    </a>
                  </dd>
                </div>
                <div className="flex gap-x-4">
                  <dt className="flex-none">
                    <Clock className="h-7 w-6 text-blue-600" aria-hidden="true" />
                  </dt>
                  <dd>
                    Support Hours: 6 AM - 8 PM ET, Monday - Friday
                  </dd>
                </div>
              </dl>

              {/* Support Options */}
              <div className="mt-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  How Can We Help?
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-700">Technical support and troubleshooting</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">Trading strategy consultation</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Award className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-700">Custom enterprise solutions</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Send us a message
              </h3>
              
              {submitted && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">
                    Thank you for your message! We'll get back to you within 24 hours.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-semibold leading-6 text-gray-900">
                    Name
                  </label>
                  <div className="mt-2.5">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-sm font-semibold leading-6 text-gray-900">
                    Email
                  </label>
                  <div className="mt-2.5">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="subject" className="block text-sm font-semibold leading-6 text-gray-900">
                    Subject
                  </label>
                  <div className="mt-2.5">
                    <select
                      name="subject"
                      id="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    >
                      <option value="">Select a topic</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing Question</option>
                      <option value="feature">Feature Request</option>
                      <option value="partnership">Partnership Opportunity</option>
                    </select>
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="message" className="block text-sm font-semibold leading-6 text-gray-900">
                    Message
                  </label>
                  <div className="mt-2.5">
                    <textarea
                      name="message"
                      id="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={submitted}
                  className="block w-full rounded-md bg-blue-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition-all transform hover:scale-105 flex items-center justify-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitted ? 'Message Sent!' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Quick Answers
            </h2>
          </div>
          
          <div className="mx-auto mt-16 max-w-4xl">
            <dl className="space-y-8">
              <div>
                <dt className="text-lg font-semibold leading-7 text-gray-900">
                  How quickly can I get started?
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  You can start your free trial immediately. Simply sign up, and you'll have instant access 
                  to our full platform with real-time options scanning capabilities.
                </dd>
              </div>
              
              <div>
                <dt className="text-lg font-semibold leading-7 text-gray-900">
                  Do you offer training or onboarding?
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Yes! We provide comprehensive onboarding for new users, including video tutorials, 
                  strategy guides, and one-on-one support sessions to help you get the most out of SnoopFlow.
                </dd>
              </div>
              
              <div>
                <dt className="text-lg font-semibold leading-7 text-gray-900">
                  What's your refund policy?
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  We offer a 30-day money-back guarantee. If you're not completely satisfied with SnoopFlow, 
                  we'll refund your subscription, no questions asked.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}