'use client';

import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Cookie Policy
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: January 2025
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="prose prose-lg max-w-none">
              
              {/* Introduction */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
                <p className="text-gray-700 mb-4">
                  Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and analyzing how you use our platform.
                </p>
                <p className="text-gray-700">
                  This Cookie Policy explains what cookies we use, why we use them, and how you can manage your cookie preferences on BCD Marketplace.
                </p>
              </section>

              {/* Types of Cookies */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2.1 Essential Cookies</h3>
                <p className="text-gray-700 mb-4">
                  These cookies are necessary for the website to function properly. They enable core functionality such as:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Wallet connection and authentication</li>
                  <li>Shopping cart functionality</li>
                  <li>Security features</li>
                  <li>Load balancing</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  <strong>Duration:</strong> Session cookies (deleted when you close your browser) or up to 1 year<br/>
                  <strong>Can be disabled:</strong> No - these are essential for the platform to work
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2.2 Performance Cookies</h3>
                <p className="text-gray-700 mb-4">
                  These cookies help us understand how visitors interact with our website by collecting anonymous information:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Page views and navigation patterns</li>
                  <li>Time spent on pages</li>
                  <li>Error messages encountered</li>
                  <li>Loading times and performance metrics</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  <strong>Duration:</strong> Up to 2 years<br/>
                  <strong>Can be disabled:</strong> Yes
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2.3 Functional Cookies</h3>
                <p className="text-gray-700 mb-4">
                  These cookies enable enhanced functionality and personalization:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Language preferences</li>
                  <li>Theme settings (dark/light mode)</li>
                  <li>Recently viewed products</li>
                  <li>Search preferences</li>
                  <li>Notification settings</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  <strong>Duration:</strong> Up to 1 year<br/>
                  <strong>Can be disabled:</strong> Yes
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2.4 Analytics Cookies</h3>
                <p className="text-gray-700 mb-4">
                  We use analytics cookies to understand user behavior and improve our platform:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Google Analytics (anonymized)</li>
                  <li>User journey tracking</li>
                  <li>Conversion tracking</li>
                  <li>A/B testing data</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  <strong>Duration:</strong> Up to 2 years<br/>
                  <strong>Can be disabled:</strong> Yes
                </p>
              </section>

              {/* Third-Party Cookies */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Third-Party Cookies</h2>
                <p className="text-gray-700 mb-4">
                  Some cookies are set by third-party services that appear on our platform:
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3.1 Wallet Providers</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li><strong>MetaMask:</strong> Wallet connection and transaction signing</li>
                  <li><strong>WalletConnect:</strong> Mobile wallet integration</li>
                  <li><strong>Coinbase Wallet:</strong> Wallet connectivity</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3.2 Analytics Services</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li><strong>Google Analytics:</strong> Website usage analytics</li>
                  <li><strong>Mixpanel:</strong> User behavior tracking</li>
                  <li><strong>Hotjar:</strong> User experience analysis</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3.3 Support Services</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li><strong>Intercom:</strong> Customer support chat</li>
                  <li><strong>Zendesk:</strong> Help desk functionality</li>
                </ul>
                
                <p className="text-gray-700">
                  These third-party services have their own cookie policies. We recommend reviewing their privacy policies for more information.
                </p>
              </section>

              {/* Local Storage */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Local Storage and Session Storage</h2>
                <p className="text-gray-700 mb-4">
                  In addition to cookies, we use browser storage technologies:
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4.1 Local Storage</h3>
                <p className="text-gray-700 mb-4">
                  We store data locally on your device for:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>User preferences and settings</li>
                  <li>Shopping cart contents</li>
                  <li>Recently viewed items</li>
                  <li>Draft messages and forms</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4.2 Session Storage</h3>
                <p className="text-gray-700 mb-4">
                  Temporary storage for the current session:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Navigation state</li>
                  <li>Form data</li>
                  <li>Temporary user inputs</li>
                </ul>
              </section>

              {/* Cookie Management */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Managing Your Cookie Preferences</h2>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5.1 Cookie Consent Banner</h3>
                <p className="text-gray-700 mb-4">
                  When you first visit our website, you'll see a cookie consent banner. You can:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Accept all cookies</li>
                  <li>Reject non-essential cookies</li>
                  <li>Customize your preferences</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5.2 Browser Settings</h3>
                <p className="text-gray-700 mb-4">
                  You can control cookies through your browser settings:
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Chrome:</h4>
                  <p className="text-gray-700 text-sm">Settings → Privacy and Security → Cookies and other site data</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Firefox:</h4>
                  <p className="text-gray-700 text-sm">Settings → Privacy & Security → Cookies and Site Data</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Safari:</h4>
                  <p className="text-gray-700 text-sm">Preferences → Privacy → Manage Website Data</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Edge:</h4>
                  <p className="text-gray-700 text-sm">Settings → Cookies and site permissions → Cookies and site data</p>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5.3 Opt-Out Links</h3>
                <p className="text-gray-700 mb-4">
                  You can opt out of specific analytics services:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li><a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out</a></li>
                  <li><a href="https://mixpanel.com/optout/" className="text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer">Mixpanel Opt-out</a></li>
                  <li><a href="https://www.hotjar.com/legal/compliance/opt-out" className="text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer">Hotjar Opt-out</a></li>
                </ul>
              </section>

              {/* Impact of Disabling Cookies */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Impact of Disabling Cookies</h2>
                <p className="text-gray-700 mb-4">
                  Disabling certain cookies may affect your experience on our platform:
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6.1 Essential Cookies</h3>
                <p className="text-gray-700 mb-4">
                  Disabling essential cookies will prevent the platform from functioning properly. You may experience:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Inability to connect your wallet</li>
                  <li>Loss of shopping cart contents</li>
                  <li>Security vulnerabilities</li>
                  <li>Login issues</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6.2 Non-Essential Cookies</h3>
                <p className="text-gray-700 mb-4">
                  Disabling non-essential cookies may result in:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Loss of personalized settings</li>
                  <li>Repeated cookie consent prompts</li>
                  <li>Less relevant content</li>
                  <li>Reduced platform optimization</li>
                </ul>
              </section>

              {/* Data Protection */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Protection and Security</h2>
                <p className="text-gray-700 mb-4">
                  We implement appropriate security measures to protect cookie data:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li><strong>Encryption:</strong> Sensitive cookie data is encrypted</li>
                  <li><strong>Secure flags:</strong> Cookies are marked as secure when appropriate</li>
                  <li><strong>HttpOnly flags:</strong> Prevents client-side script access where appropriate</li>
                  <li><strong>SameSite attributes:</strong> Protects against CSRF attacks</li>
                  <li><strong>Regular audits:</strong> We regularly review our cookie usage</li>
                </ul>
              </section>

              {/* Legal Basis */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Legal Basis for Cookie Use</h2>
                <p className="text-gray-700 mb-4">
                  Our legal basis for using cookies depends on the type:
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">8.1 Essential Cookies</h3>
                <p className="text-gray-700 mb-4">
                  <strong>Legal basis:</strong> Legitimate interest - necessary for the platform to function
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">8.2 Non-Essential Cookies</h3>
                <p className="text-gray-700 mb-4">
                  <strong>Legal basis:</strong> Consent - you have given explicit consent through our cookie banner
                </p>
              </section>

              {/* International Transfers */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
                <p className="text-gray-700 mb-4">
                  Some of our third-party cookie providers may transfer data internationally. We ensure appropriate safeguards are in place:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Adequacy decisions</li>
                  <li>Standard contractual clauses</li>
                  <li>Binding corporate rules</li>
                  <li>Certification schemes</li>
                </ul>
              </section>

              {/* Updates to Cookie Policy */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Updates to This Cookie Policy</h2>
                <p className="text-gray-700 mb-4">
                  We may update this Cookie Policy from time to time to reflect:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Changes in our cookie usage</li>
                  <li>New features or services</li>
                  <li>Legal or regulatory requirements</li>
                  <li>Best practice updates</li>
                </ul>
                <p className="text-gray-700">
                  We will notify you of significant changes through our platform or by email.
                </p>
              </section>

              {/* Contact Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about our use of cookies, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Privacy Team:</strong> privacy@bcdmarketplace.com<br/>
                    <strong>Data Protection Officer:</strong> dpo@bcdmarketplace.com<br/>
                    <strong>General Support:</strong> support@bcdmarketplace.com<br/>
                    <strong>Address:</strong> [Company Address]
                  </p>
                </div>
              </section>

              {/* Cookie Preference Center */}
              <section className="mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Manage Your Cookie Preferences</h3>
                  <p className="text-blue-800 mb-4">
                    You can update your cookie preferences at any time by clicking the button below:
                  </p>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Cookie Preferences
                  </button>
                </div>
              </section>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Related Documents:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</a>
              <a href="/terms" className="text-blue-600 hover:text-blue-700 underline">Terms of Service</a>
              <a href="/security" className="text-blue-600 hover:text-blue-700 underline">Security</a>
              <a href="/contact" className="text-blue-600 hover:text-blue-700 underline">Contact Us</a>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}