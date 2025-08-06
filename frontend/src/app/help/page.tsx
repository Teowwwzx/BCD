'use client';

import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function HelpPage() {
  const faqItems = [
    {
      question: "How do I create an account?",
      answer: "To create an account, click the 'Sign Up' button in the top right corner, connect your wallet, and fill out the registration form with your details."
    },
    {
      question: "How do I connect my wallet?",
      answer: "Click the 'Connect Wallet' button and select your preferred wallet (MetaMask, WalletConnect, etc.). Make sure you have a compatible Web3 wallet installed."
    },
    {
      question: "How do I buy products?",
      answer: "Browse products, click on items you want to purchase, add them to your cart, and proceed to checkout. You'll need ETH in your wallet to complete the transaction."
    },
    {
      question: "How do I sell products?",
      answer: "Go to the 'Sell' page, fill out the product details form, set your price in ETH, and submit your listing. Your product will be available for purchase once approved."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept payments in Ethereum (ETH) and other supported cryptocurrencies. All transactions are processed on the blockchain for security and transparency."
    },
    {
      question: "How do I track my orders?",
      answer: "Visit the 'Orders' page in your account to view all your purchase history and track the status of your current orders."
    },
    {
      question: "What is the return policy?",
      answer: "We offer a 30-day return window for items in original condition. Returns for defective items are free, and refunds are processed within 5-7 business days."
    },
    {
      question: "How do I resolve disputes?",
      answer: "If you have an issue with a transaction, visit our Dispute Resolution page or contact our support team. We have a blockchain-based escrow system to protect both buyers and sellers."
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we use blockchain technology and industry-standard security measures to protect your data. Your wallet address is your primary identifier, and we don't store sensitive payment information."
    },
    {
      question: "How do I contact customer support?",
      answer: "You can reach our support team through the Contact Us page, or join our Discord community for real-time assistance from our team and community members."
    }
  ];

  const guides = [
    {
      title: "Getting Started Guide",
      description: "Learn the basics of using BCD Marketplace",
      steps: [
        "Create an account and connect your wallet",
        "Browse products or start selling",
        "Make your first transaction",
        "Manage your orders and profile"
      ]
    },
    {
      title: "Seller's Guide",
      description: "Everything you need to know about selling on our platform",
      steps: [
        "Set up your seller profile",
        "Create compelling product listings",
        "Manage inventory and orders",
        "Build your reputation and reviews"
      ]
    },
    {
      title: "Buyer's Guide",
      description: "Tips for safe and successful purchasing",
      steps: [
        "How to find quality products",
        "Understanding seller ratings",
        "Secure payment practices",
        "What to do if issues arise"
      ]
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
              Help Center
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find answers to common questions and learn how to make the most of BCD Marketplace
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for help articles..."
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-blue-600 mb-4">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
              <p className="text-gray-600 mb-4">New to BCD Marketplace? Learn the basics here.</p>
              <a href="#getting-started" className="text-blue-600 hover:text-blue-700 font-medium">Learn more →</a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-green-600 mb-4">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Buying & Selling</h3>
              <p className="text-gray-600 mb-4">Learn how to buy and sell products safely.</p>
              <a href="#buying-selling" className="text-blue-600 hover:text-blue-700 font-medium">Learn more →</a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-purple-600 mb-4">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Security & Safety</h3>
              <p className="text-gray-600 mb-4">Keep your account and transactions secure.</p>
              <a href="/security" className="text-blue-600 hover:text-blue-700 font-medium">Learn more →</a>
            </div>
          </div>

          {/* Guides Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Step-by-Step Guides</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {guides.map((guide, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-2">{guide.title}</h3>
                  <p className="text-gray-600 mb-4">{guide.description}</p>
                  <ol className="space-y-2">
                    {guide.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="text-sm text-gray-700 flex items-start">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                          {stepIndex + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <details className="group">
                    <summary className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50">
                      <h3 className="text-lg font-medium text-gray-900">{item.question}</h3>
                      <svg className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-6">
                      <p className="text-gray-600">{item.answer}</p>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-blue-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
            <p className="text-gray-600 mb-6">Can't find what you're looking for? Our support team is here to help.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Contact Support
              </a>
              <a
                href="#"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-blue-600"
              >
                Join Discord Community
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}