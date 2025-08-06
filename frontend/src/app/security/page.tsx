'use client';

import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function SecurityPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const securityFeatures = [
    {
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Blockchain Security",
      description: "All transactions are secured by Ethereum blockchain technology with immutable records and smart contract protection."
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Wallet-Based Authentication",
      description: "Your wallet serves as your secure login method. No passwords to remember or store on our servers."
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Escrow Protection",
      description: "Smart contracts hold funds in escrow until delivery is confirmed, protecting both buyers and sellers."
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Real-time Monitoring",
      description: "24/7 monitoring of transactions and user activities to detect and prevent fraudulent behavior."
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m13 0h-6m-2-5a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: "Encrypted Communications",
      description: "All data transmission is encrypted using industry-standard TLS/SSL protocols."
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      title: "Audit Trail",
      description: "Complete transaction history and audit trails are maintained on the blockchain for transparency."
    }
  ];

  const bestPractices = [
    {
      category: "Wallet Security",
      tips: [
        "Never share your private keys or seed phrases with anyone",
        "Use hardware wallets for large amounts of cryptocurrency",
        "Keep your wallet software updated to the latest version",
        "Enable all available security features in your wallet",
        "Use strong, unique passwords for wallet applications"
      ]
    },
    {
      category: "Trading Safety",
      tips: [
        "Verify seller ratings and reviews before making purchases",
        "Start with small transactions when dealing with new sellers",
        "Always use the platform's escrow system for protection",
        "Document all communications with sellers",
        "Report suspicious activities immediately"
      ]
    },
    {
      category: "Account Protection",
      tips: [
        "Regularly monitor your account for unauthorized activities",
        "Log out completely when using shared computers",
        "Be cautious of phishing emails and fake websites",
        "Keep your contact information updated",
        "Use official BCD Marketplace URLs only"
      ]
    }
  ];

  const threatTypes = [
    {
      title: "Phishing Attacks",
      description: "Fake websites or emails designed to steal your wallet credentials.",
      prevention: "Always verify URLs and never enter your seed phrase on suspicious sites.",
      severity: "High"
    },
    {
      title: "Smart Contract Exploits",
      description: "Malicious contracts designed to drain your wallet.",
      prevention: "Only interact with verified contracts and use reputable platforms.",
      severity: "High"
    },
    {
      title: "Social Engineering",
      description: "Scammers impersonating support staff or other users.",
      prevention: "Never share private information and verify identities independently.",
      severity: "Medium"
    },
    {
      title: "Fake Listings",
      description: "Fraudulent product listings designed to steal payments.",
      prevention: "Check seller ratings, reviews, and use escrow protection.",
      severity: "Medium"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Security & Safety
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your security is our top priority. Learn about our comprehensive security measures and how to protect yourself while using BCD Marketplace.
            </p>
          </div>

          {/* Navigation */}
          <div className="mb-8">
            <nav className="flex space-x-8 border-b border-gray-200">
              <button
                onClick={() => setActiveSection('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Security Overview
              </button>
              <button
                onClick={() => setActiveSection('practices')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === 'practices'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Best Practices
              </button>
              <button
                onClick={() => setActiveSection('threats')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === 'threats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Threat Protection
              </button>
            </nav>
          </div>

          {/* Security Overview */}
          {activeSection === 'overview' && (
            <div className="space-y-12">
              {/* Security Features Grid */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Security Features</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {securityFeatures.map((feature, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="text-blue-600 mb-4">
                        {feature.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Stats */}
              <div className="bg-blue-50 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Security Statistics</h2>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
                    <div className="text-gray-600">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">0</div>
                    <div className="text-gray-600">Security Breaches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                    <div className="text-gray-600">Monitoring</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">256-bit</div>
                    <div className="text-gray-600">Encryption</div>
                  </div>
                </div>
              </div>

              {/* Compliance */}
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Compliance & Certifications</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Standards</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-3">
                        <div className="text-green-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>ISO 27001 Information Security</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="text-green-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>SOC 2 Type II Compliance</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="text-green-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>GDPR Data Protection</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Audits</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-3">
                        <div className="text-green-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>Smart Contract Audits by CertiK</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="text-green-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>Penetration Testing by Hacken</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="text-green-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>Quarterly Security Reviews</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Best Practices */}
          {activeSection === 'practices' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900">Security Best Practices</h2>
              {bestPractices.map((category, index) => (
                <div key={index} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{category.category}</h3>
                  <ul className="space-y-3">
                    {category.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="flex items-start space-x-3">
                        <div className="text-green-600 mt-1">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Emergency Procedures */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4">Emergency Security Procedures</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">If you suspect unauthorized access:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-red-700 text-sm">
                      <li>Immediately disconnect your wallet from all dApps</li>
                      <li>Change your wallet password and enable 2FA if available</li>
                      <li>Contact our emergency support: emergency@bcdmarketplace.com</li>
                      <li>Monitor your wallet for any unauthorized transactions</li>
                      <li>Consider moving funds to a new wallet if necessary</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">If you've been scammed:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-red-700 text-sm">
                      <li>Document all evidence (screenshots, transaction hashes, communications)</li>
                      <li>File a dispute through our platform immediately</li>
                      <li>Report the incident to our security team</li>
                      <li>Do not engage further with the scammer</li>
                      <li>Consider reporting to relevant authorities if significant funds are involved</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Threat Protection */}
          {activeSection === 'threats' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900">Common Threats & Protection</h2>
              <div className="grid gap-6">
                {threatTypes.map((threat, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{threat.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        threat.severity === 'High' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {threat.severity} Risk
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{threat.description}</p>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Prevention:</strong> {threat.prevention}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Security Tools */}
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Recommended Security Tools</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Wallet Security</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Hardware wallets (Ledger, Trezor)</li>
                      <li>• MetaMask with hardware wallet integration</li>
                      <li>• Multi-signature wallets for large amounts</li>
                      <li>• Wallet backup and recovery tools</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Browser Security</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Browser extensions for phishing protection</li>
                      <li>• VPN services for additional privacy</li>
                      <li>• Ad blockers to prevent malicious ads</li>
                      <li>• Regular browser security updates</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Security Team */}
          <div className="mt-12 bg-gray-900 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Security Questions or Concerns?</h2>
            <p className="text-gray-300 mb-6">
              Our security team is available 24/7 to help with any security-related issues or questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:security@bcdmarketplace.com"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Contact Security Team
              </a>
              <a
                href="/contact"
                className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                General Support
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}