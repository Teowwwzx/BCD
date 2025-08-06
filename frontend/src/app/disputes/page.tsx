'use client';

import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function DisputesPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const disputeTypes = [
    {
      title: "Item Not Received",
      description: "You paid for an item but never received it from the seller.",
      timeframe: "File within 30 days of purchase",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      title: "Item Not as Described",
      description: "The item you received doesn't match the seller's description or photos.",
      timeframe: "File within 14 days of delivery",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Damaged Item",
      description: "The item arrived damaged or broken during shipping.",
      timeframe: "File within 7 days of delivery",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    {
      title: "Unauthorized Transaction",
      description: "A transaction was made from your account without your permission.",
      timeframe: "File immediately upon discovery",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    }
  ];

  const disputeProcess = [
    {
      step: 1,
      title: "Contact the Seller",
      description: "Try to resolve the issue directly with the seller first. Most issues can be resolved through communication.",
      duration: "2-3 days"
    },
    {
      step: 2,
      title: "File a Dispute",
      description: "If you can't reach an agreement, file a formal dispute through our platform with evidence.",
      duration: "1 day"
    },
    {
      step: 3,
      title: "Investigation",
      description: "Our team reviews the evidence from both parties and investigates the blockchain transaction.",
      duration: "3-5 days"
    },
    {
      step: 4,
      title: "Resolution",
      description: "We make a decision based on our findings and execute the appropriate resolution.",
      duration: "1-2 days"
    }
  ];

  const evidenceTypes = [
    "Screenshots of conversations with the seller",
    "Photos of the received item (if applicable)",
    "Transaction hash from the blockchain",
    "Order confirmation and tracking information",
    "Any relevant documentation or receipts",
    "Video evidence (for damaged items)"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Dispute Resolution
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our blockchain-based dispute resolution system ensures fair and transparent resolution of conflicts between buyers and sellers.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <nav className="flex space-x-8 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('process')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'process'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dispute Process
              </button>
              <button
                onClick={() => setActiveTab('file')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'file'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                File a Dispute
              </button>
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-12">
              {/* Dispute Types */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Dispute Types</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {disputeTypes.map((type, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-start space-x-4">
                        <div className="text-blue-600 mt-1">
                          {type.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.title}</h3>
                          <p className="text-gray-600 mb-3">{type.description}</p>
                          <p className="text-sm text-blue-600 font-medium">{type.timeframe}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blockchain Protection */}
              <div className="bg-blue-50 rounded-lg p-8">
                <div className="text-center">
                  <div className="text-blue-600 mb-4">
                    <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Blockchain-Secured Protection</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                    All transactions on BCD Marketplace are secured by blockchain technology, providing immutable records and smart contract-based escrow protection.
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 text-left">
                    <div className="bg-white p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Escrow Protection</h3>
                      <p className="text-sm text-gray-600">Funds are held in smart contracts until delivery is confirmed</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Immutable Records</h3>
                      <p className="text-sm text-gray-600">All transaction data is permanently recorded on the blockchain</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Automated Resolution</h3>
                      <p className="text-sm text-gray-600">Smart contracts can automatically execute refunds when conditions are met</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Resolution Statistics</h2>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">98.5%</div>
                    <div className="text-gray-600">Resolution Rate</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">4.2</div>
                    <div className="text-gray-600">Avg. Days to Resolve</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">92%</div>
                    <div className="text-gray-600">User Satisfaction</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
                    <div className="text-gray-600">Support Available</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Process Tab */}
          {activeTab === 'process' && (
            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">How Dispute Resolution Works</h2>
                <div className="space-y-8">
                  {disputeProcess.map((step, index) => (
                    <div key={index} className="flex items-start space-x-6">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                          {step.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                              {step.duration}
                            </span>
                          </div>
                          <p className="text-gray-600">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Requirements */}
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Evidence Requirements</h2>
                <p className="text-gray-600 mb-6">
                  To ensure a fair resolution, please provide as much evidence as possible when filing a dispute:
                </p>
                <ul className="space-y-3">
                  {evidenceTypes.map((evidence, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="text-green-600 mt-1">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{evidence}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* File Dispute Tab */}
          {activeTab === 'file' && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">File a Dispute</h2>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="text-yellow-600 mt-1">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-yellow-800 mb-1">Before Filing a Dispute</h3>
                      <p className="text-yellow-700 text-sm">
                        Please try to contact the seller first to resolve the issue. Many problems can be solved through direct communication.
                      </p>
                    </div>
                  </div>
                </div>

                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order/Transaction ID *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your order or transaction ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dispute Type *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select dispute type</option>
                      <option value="not-received">Item Not Received</option>
                      <option value="not-described">Item Not as Described</option>
                      <option value="damaged">Damaged Item</option>
                      <option value="unauthorized">Unauthorized Transaction</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please provide a detailed description of the issue, including what you expected vs. what you received..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evidence Files
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-gray-600 mb-2">Upload evidence files</p>
                      <p className="text-sm text-gray-500">PNG, JPG, PDF up to 10MB each</p>
                      <button
                        type="button"
                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Choose Files
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">What Happens Next?</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• We'll notify the seller about your dispute</li>
                      <li>• Our team will review all evidence within 24 hours</li>
                      <li>• You'll receive updates via email and in your account</li>
                      <li>• Resolution typically takes 3-5 business days</li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    File Dispute
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}