'use client';

import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
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
                  BCD Marketplace ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our decentralized marketplace platform.
                </p>
                <p className="text-gray-700">
                  By using our platform, you consent to the data practices described in this policy. If you do not agree with this policy, please do not use our services.
                </p>
              </section>

              {/* Information We Collect */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2.1 Wallet Information</h3>
                <p className="text-gray-700 mb-4">
                  When you connect your cryptocurrency wallet to our platform, we collect your wallet address. We do not have access to your private keys or seed phrases.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2.2 Transaction Data</h3>
                <p className="text-gray-700 mb-4">
                  We collect information about your transactions on our platform, including:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Transaction amounts and timestamps</li>
                  <li>Product or service details</li>
                  <li>Buyer and seller wallet addresses</li>
                  <li>Transaction status and completion data</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2.3 Profile Information</h3>
                <p className="text-gray-700 mb-4">
                  You may choose to provide additional profile information such as:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Display name or username</li>
                  <li>Profile picture or avatar</li>
                  <li>Bio or description</li>
                  <li>Contact preferences</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2.4 Usage Data</h3>
                <p className="text-gray-700 mb-4">
                  We automatically collect certain information about your use of our platform:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>IP address and location data</li>
                  <li>Browser type and version</li>
                  <li>Device information</li>
                  <li>Pages visited and time spent</li>
                  <li>Referral sources</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2.5 Communication Data</h3>
                <p className="text-gray-700 mb-4">
                  When you contact us or communicate through our platform, we may collect:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Messages and correspondence</li>
                  <li>Support ticket information</li>
                  <li>Feedback and reviews</li>
                </ul>
              </section>

              {/* How We Use Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-700 mb-4">
                  We use the collected information for the following purposes:
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3.1 Platform Operations</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Facilitate transactions between users</li>
                  <li>Maintain and improve platform functionality</li>
                  <li>Process payments and manage escrow services</li>
                  <li>Provide customer support</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3.2 Security and Compliance</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Detect and prevent fraud</li>
                  <li>Comply with legal and regulatory requirements</li>
                  <li>Enforce our Terms of Service</li>
                  <li>Protect against security threats</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3.3 Communication</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Send transaction notifications</li>
                  <li>Provide platform updates</li>
                  <li>Respond to inquiries and support requests</li>
                  <li>Send important security alerts</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3.4 Analytics and Improvement</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Analyze platform usage patterns</li>
                  <li>Improve user experience</li>
                  <li>Develop new features</li>
                  <li>Generate anonymized statistics</li>
                </ul>
              </section>

              {/* Information Sharing */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4.1 Public Blockchain Data</h3>
                <p className="text-gray-700 mb-4">
                  Transaction data recorded on the blockchain is publicly visible and immutable. This includes wallet addresses, transaction amounts, and timestamps.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4.2 Service Providers</h3>
                <p className="text-gray-700 mb-4">
                  We may share information with trusted third-party service providers who assist us in:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Cloud hosting and infrastructure</li>
                  <li>Analytics and monitoring</li>
                  <li>Customer support tools</li>
                  <li>Security services</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4.3 Legal Requirements</h3>
                <p className="text-gray-700 mb-4">
                  We may disclose your information when required by law or to:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Comply with legal processes</li>
                  <li>Respond to government requests</li>
                  <li>Protect our rights and property</li>
                  <li>Ensure user safety</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4.4 Business Transfers</h3>
                <p className="text-gray-700 mb-4">
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity, subject to the same privacy protections.
                </p>
              </section>

              {/* Data Security */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
                <p className="text-gray-700 mb-4">
                  We implement appropriate technical and organizational measures to protect your personal information:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and assessments</li>
                  <li>Access controls and authentication</li>
                  <li>Secure development practices</li>
                  <li>Incident response procedures</li>
                </ul>
                <p className="text-gray-700">
                  However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security of your information.
                </p>
              </section>

              {/* Data Retention */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
                <p className="text-gray-700 mb-4">
                  We retain your personal information for as long as necessary to:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Provide our services to you</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes</li>
                  <li>Enforce our agreements</li>
                </ul>
                <p className="text-gray-700">
                  When we no longer need your personal information, we will securely delete or anonymize it, unless we are required to retain it by law.
                </p>
              </section>

              {/* Your Rights */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Privacy Rights</h2>
                <p className="text-gray-700 mb-4">
                  Depending on your jurisdiction, you may have the following rights regarding your personal information:
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7.1 Access and Portability</h3>
                <p className="text-gray-700 mb-4">
                  You have the right to request access to your personal information and receive a copy in a portable format.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7.2 Correction</h3>
                <p className="text-gray-700 mb-4">
                  You can request correction of inaccurate or incomplete personal information.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7.3 Deletion</h3>
                <p className="text-gray-700 mb-4">
                  You may request deletion of your personal information, subject to certain legal limitations.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7.4 Objection and Restriction</h3>
                <p className="text-gray-700 mb-4">
                  You can object to certain processing activities or request restriction of processing.
                </p>
                
                <p className="text-gray-700 mb-4">
                  To exercise these rights, please contact us at privacy@bcdmarketplace.com. We will respond to your request within the timeframe required by applicable law.
                </p>
              </section>

              {/* Cookies and Tracking */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking Technologies</h2>
                <p className="text-gray-700 mb-4">
                  We use cookies and similar tracking technologies to:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Remember your preferences</li>
                  <li>Analyze platform usage</li>
                  <li>Improve user experience</li>
                  <li>Provide personalized content</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  You can control cookie settings through your browser preferences. However, disabling cookies may affect platform functionality.
                </p>
                <p className="text-gray-700">
                  For more information, please see our Cookie Policy.
                </p>
              </section>

              {/* Third-Party Services */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Third-Party Services</h2>
                <p className="text-gray-700 mb-4">
                  Our platform may integrate with third-party services such as:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Cryptocurrency wallets (MetaMask, WalletConnect, etc.)</li>
                  <li>Blockchain networks and explorers</li>
                  <li>Analytics providers</li>
                  <li>Payment processors</li>
                </ul>
                <p className="text-gray-700">
                  These third parties have their own privacy policies, and we are not responsible for their data practices. We encourage you to review their privacy policies.
                </p>
              </section>

              {/* International Transfers */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
                <p className="text-gray-700 mb-4">
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information during international transfers.
                </p>
                <p className="text-gray-700">
                  By using our platform, you consent to the transfer of your information to countries that may have different data protection laws than your jurisdiction.
                </p>
              </section>

              {/* Children's Privacy */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Children's Privacy</h2>
                <p className="text-gray-700 mb-4">
                  Our platform is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.
                </p>
                <p className="text-gray-700">
                  If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information promptly.
                </p>
              </section>

              {/* Changes to Privacy Policy */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
                <p className="text-gray-700 mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Posting the updated policy on our platform</li>
                  <li>Updating the "Last updated" date</li>
                  <li>Sending email notifications for significant changes</li>
                </ul>
                <p className="text-gray-700">
                  Your continued use of the platform after changes to this policy constitutes acceptance of the updated terms.
                </p>
              </section>

              {/* Contact Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Privacy Officer:</strong> privacy@bcdmarketplace.com<br/>
                    <strong>General Support:</strong> support@bcdmarketplace.com<br/>
                    <strong>Address:</strong> [Company Address]<br/>
                    <strong>Phone:</strong> [Phone Number]
                  </p>
                </div>
              </section>

              {/* Acknowledgment */}
              <section className="mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Your Consent</h3>
                  <p className="text-blue-800">
                    By using BCD Marketplace, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and disclosure of your information as described herein.
                  </p>
                </div>
              </section>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Related Documents:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/terms" className="text-blue-600 hover:text-blue-700 underline">Terms of Service</a>
              <a href="/cookies" className="text-blue-600 hover:text-blue-700 underline">Cookie Policy</a>
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