'use client';

import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: January 2025
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="prose prose-lg max-w-none">
              
              {/* Introduction */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-700 mb-4">
                  Welcome to BCD Marketplace ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our decentralized marketplace platform and services. By accessing or using our platform, you agree to be bound by these Terms.
                </p>
                <p className="text-gray-700">
                  Our platform operates on blockchain technology and facilitates peer-to-peer transactions between users. We do not take custody of funds or act as an intermediary in transactions.
                </p>
              </section>

              {/* Acceptance of Terms */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Acceptance of Terms</h2>
                <p className="text-gray-700 mb-4">
                  By connecting your wallet and using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you may not use our platform.
                </p>
                <p className="text-gray-700">
                  You must be at least 18 years old to use our platform. By using our services, you represent and warrant that you meet this age requirement.
                </p>
              </section>

              {/* Platform Description */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Platform Description</h2>
                <p className="text-gray-700 mb-4">
                  BCD Marketplace is a decentralized platform that enables users to:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>List products and services for sale</li>
                  <li>Purchase products and services from other users</li>
                  <li>Engage in peer-to-peer transactions using cryptocurrency</li>
                  <li>Access dispute resolution services</li>
                  <li>Participate in the platform's governance (where applicable)</li>
                </ul>
                <p className="text-gray-700">
                  All transactions are facilitated through smart contracts on the Ethereum blockchain.
                </p>
              </section>

              {/* User Responsibilities */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Responsibilities</h2>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4.1 Account Security</h3>
                <p className="text-gray-700 mb-4">
                  You are solely responsible for maintaining the security of your wallet and private keys. We do not have access to your private keys and cannot recover them if lost.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4.2 Accurate Information</h3>
                <p className="text-gray-700 mb-4">
                  You must provide accurate, current, and complete information when listing products or services. Misrepresentation of products or services is strictly prohibited.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4.3 Compliance with Laws</h3>
                <p className="text-gray-700 mb-4">
                  You must comply with all applicable local, state, national, and international laws and regulations when using our platform.
                </p>
              </section>

              {/* Prohibited Activities */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Prohibited Activities</h2>
                <p className="text-gray-700 mb-4">
                  You may not use our platform to:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Sell illegal goods or services</li>
                  <li>Engage in fraudulent activities or scams</li>
                  <li>Violate intellectual property rights</li>
                  <li>Manipulate prices or engage in market manipulation</li>
                  <li>Create fake accounts or impersonate others</li>
                  <li>Spam or harass other users</li>
                  <li>Attempt to hack or compromise the platform's security</li>
                  <li>Circumvent any security measures or access controls</li>
                </ul>
              </section>

              {/* Transactions and Payments */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Transactions and Payments</h2>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6.1 Cryptocurrency Payments</h3>
                <p className="text-gray-700 mb-4">
                  All transactions on our platform are conducted using cryptocurrency. You acknowledge the risks associated with cryptocurrency transactions, including price volatility and irreversibility.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6.2 Transaction Fees</h3>
                <p className="text-gray-700 mb-4">
                  Users are responsible for paying blockchain transaction fees (gas fees) associated with their transactions. Our platform may charge additional service fees, which will be clearly disclosed.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6.3 Escrow Services</h3>
                <p className="text-gray-700 mb-4">
                  Our smart contract escrow system holds funds until transaction conditions are met. Funds may be released automatically or through dispute resolution processes.
                </p>
              </section>

              {/* Dispute Resolution */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Dispute Resolution</h2>
                <p className="text-gray-700 mb-4">
                  In case of disputes between users, our platform provides a dispute resolution mechanism. Our team will review evidence and make decisions based on our dispute resolution policies.
                </p>
                <p className="text-gray-700 mb-4">
                  By using our platform, you agree to participate in good faith in our dispute resolution process before pursuing other legal remedies.
                </p>
              </section>

              {/* Intellectual Property */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
                <p className="text-gray-700 mb-4">
                  The platform's software, design, and content are protected by intellectual property laws. You may not copy, modify, or distribute our platform without permission.
                </p>
                <p className="text-gray-700 mb-4">
                  Users retain ownership of their product listings and content but grant us a license to display and distribute such content on our platform.
                </p>
              </section>

              {/* Privacy and Data */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Privacy and Data</h2>
                <p className="text-gray-700 mb-4">
                  Our privacy practices are described in our Privacy Policy. By using our platform, you consent to the collection and use of your information as described in our Privacy Policy.
                </p>
                <p className="text-gray-700 mb-4">
                  We implement appropriate security measures to protect your personal information, but we cannot guarantee absolute security.
                </p>
              </section>

              {/* Disclaimers */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Disclaimers</h2>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">10.1 Platform Availability</h3>
                <p className="text-gray-700 mb-4">
                  We strive to maintain platform availability but do not guarantee uninterrupted service. The platform may be temporarily unavailable due to maintenance, updates, or technical issues.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">10.2 Third-Party Content</h3>
                <p className="text-gray-700 mb-4">
                  We are not responsible for the accuracy, quality, or legality of products listed by users. Users transact at their own risk.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">10.3 Blockchain Risks</h3>
                <p className="text-gray-700 mb-4">
                  You acknowledge the risks associated with blockchain technology, including but not limited to network congestion, failed transactions, and smart contract vulnerabilities.
                </p>
              </section>

              {/* Limitation of Liability */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Limitation of Liability</h2>
                <p className="text-gray-700 mb-4">
                  To the maximum extent permitted by law, BCD Marketplace and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.
                </p>
                <p className="text-gray-700 mb-4">
                  Our total liability to you for any claims arising from these Terms or your use of the platform shall not exceed the amount of fees you have paid to us in the 12 months preceding the claim.
                </p>
              </section>

              {/* Indemnification */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Indemnification</h2>
                <p className="text-gray-700 mb-4">
                  You agree to indemnify and hold harmless BCD Marketplace and its affiliates from any claims, damages, or expenses arising from your use of the platform, violation of these Terms, or infringement of any rights of another party.
                </p>
              </section>

              {/* Termination */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Termination</h2>
                <p className="text-gray-700 mb-4">
                  We may terminate or suspend your access to the platform at any time, with or without cause, and with or without notice. You may stop using the platform at any time.
                </p>
                <p className="text-gray-700 mb-4">
                  Upon termination, your right to use the platform will cease immediately, but these Terms will continue to apply to any prior use of the platform.
                </p>
              </section>

              {/* Governing Law */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Governing Law</h2>
                <p className="text-gray-700 mb-4">
                  These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions.
                </p>
                <p className="text-gray-700 mb-4">
                  Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of [Jurisdiction].
                </p>
              </section>

              {/* Changes to Terms */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Changes to Terms</h2>
                <p className="text-gray-700 mb-4">
                  We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the updated Terms on our platform and updating the "Last updated" date.
                </p>
                <p className="text-gray-700 mb-4">
                  Your continued use of the platform after changes to the Terms constitutes acceptance of the new Terms.
                </p>
              </section>

              {/* Contact Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about these Terms, please contact us at:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Email:</strong> legal@bcdmarketplace.com<br/>
                    <strong>Address:</strong> [Company Address]<br/>
                    <strong>Support:</strong> support@bcdmarketplace.com
                  </p>
                </div>
              </section>

              {/* Acknowledgment */}
              <section className="mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Acknowledgment</h3>
                  <p className="text-blue-800">
                    By using BCD Marketplace, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them. These Terms constitute a legally binding agreement between you and BCD Marketplace.
                  </p>
                </div>
              </section>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Related Documents:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</a>
              <a href="/cookies" className="text-blue-600 hover:text-blue-700 underline">Cookie Policy</a>
              <a href="/compliance" className="text-blue-600 hover:text-blue-700 underline">Compliance</a>
              <a href="/contact" className="text-blue-600 hover:text-blue-700 underline">Contact Us</a>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}