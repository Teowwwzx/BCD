'use client';

import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Compliance & Regulatory
            </h1>
            <p className="text-lg text-gray-600">
              Our commitment to legal compliance and regulatory standards
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="prose prose-lg max-w-none">
              
              {/* Introduction */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Compliance Overview</h2>
                <p className="text-gray-700 mb-4">
                  BCD Marketplace is committed to operating in full compliance with applicable laws and regulations across all jurisdictions where we provide services. We maintain the highest standards of legal and regulatory compliance to protect our users and ensure platform integrity.
                </p>
                <p className="text-gray-700">
                  This page outlines our compliance framework, regulatory adherence, and the measures we take to ensure ongoing compliance with evolving legal requirements.
                </p>
              </section>

              {/* Regulatory Framework */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Regulatory Framework</h2>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2.1 Financial Regulations</h3>
                <p className="text-gray-700 mb-4">
                  We comply with relevant financial services regulations including:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li><strong>Anti-Money Laundering (AML):</strong> Comprehensive AML policies and procedures</li>
                  <li><strong>Know Your Customer (KYC):</strong> Identity verification and customer due diligence</li>
                  <li><strong>Counter-Terrorism Financing (CTF):</strong> Screening and monitoring systems</li>
                  <li><strong>Payment Services Regulations:</strong> Compliance with payment processing laws</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2.2 Data Protection Laws</h3>
                <p className="text-gray-700 mb-4">
                  We adhere to major data protection regulations:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li><strong>GDPR (EU):</strong> General Data Protection Regulation compliance</li>
                  <li><strong>CCPA (California):</strong> California Consumer Privacy Act adherence</li>
                  <li><strong>PIPEDA (Canada):</strong> Personal Information Protection and Electronic Documents Act</li>
                  <li><strong>Local Privacy Laws:</strong> Compliance with jurisdiction-specific privacy regulations</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2.3 Cryptocurrency Regulations</h3>
                <p className="text-gray-700 mb-4">
                  We monitor and comply with evolving cryptocurrency regulations:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li><strong>Digital Asset Regulations:</strong> Compliance with digital asset laws</li>
                  <li><strong>Securities Laws:</strong> Ensuring tokens are not classified as securities</li>
                  <li><strong>Tax Reporting:</strong> Facilitating user tax compliance</li>
                  <li><strong>Licensing Requirements:</strong> Obtaining necessary licenses where required</li>
                </ul>
              </section>

              {/* AML/KYC Program */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Anti-Money Laundering (AML) Program</h2>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3.1 AML Policy</h3>
                <p className="text-gray-700 mb-4">
                  Our comprehensive AML program includes:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Risk-based customer due diligence procedures</li>
                  <li>Ongoing transaction monitoring and analysis</li>
                  <li>Suspicious activity reporting to relevant authorities</li>
                  <li>Regular AML training for all staff</li>
                  <li>Independent AML compliance testing</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3.2 Customer Identification Program (CIP)</h3>
                <p className="text-gray-700 mb-4">
                  We implement robust customer identification procedures:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Identity verification for high-value transactions</li>
                  <li>Document authentication and validation</li>
                  <li>Biometric verification where applicable</li>
                  <li>Enhanced due diligence for high-risk customers</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3.3 Transaction Monitoring</h3>
                <p className="text-gray-700 mb-4">
                  Our automated systems monitor transactions for:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Unusual transaction patterns</li>
                  <li>Large or structured transactions</li>
                  <li>Transactions involving high-risk jurisdictions</li>
                  <li>Potential sanctions violations</li>
                </ul>
              </section>

              {/* Sanctions Compliance */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Sanctions Compliance</h2>
                <p className="text-gray-700 mb-4">
                  We maintain strict compliance with international sanctions programs:
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4.1 Sanctions Screening</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li><strong>OFAC (US):</strong> Office of Foreign Assets Control sanctions lists</li>
                  <li><strong>EU Sanctions:</strong> European Union consolidated sanctions list</li>
                  <li><strong>UN Sanctions:</strong> United Nations Security Council sanctions</li>
                  <li><strong>National Lists:</strong> Country-specific sanctions and watch lists</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4.2 Prohibited Jurisdictions</h3>
                <p className="text-gray-700 mb-4">
                  We restrict access from certain jurisdictions based on:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>International sanctions regimes</li>
                  <li>High-risk jurisdiction designations</li>
                  <li>Regulatory restrictions</li>
                  <li>Legal compliance requirements</li>
                </ul>
              </section>

              {/* Data Protection Compliance */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Protection Compliance</h2>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5.1 GDPR Compliance</h3>
                <p className="text-gray-700 mb-4">
                  Our GDPR compliance measures include:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Lawful basis for data processing</li>
                  <li>Data subject rights implementation</li>
                  <li>Privacy by design and by default</li>
                  <li>Data Protection Impact Assessments (DPIAs)</li>
                  <li>Breach notification procedures</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5.2 Cross-Border Data Transfers</h3>
                <p className="text-gray-700 mb-4">
                  We ensure adequate protection for international data transfers through:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Standard Contractual Clauses (SCCs)</li>
                  <li>Adequacy decisions</li>
                  <li>Binding Corporate Rules (BCRs)</li>
                  <li>Certification mechanisms</li>
                </ul>
              </section>

              {/* Tax Compliance */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Tax Compliance</h2>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6.1 Tax Reporting</h3>
                <p className="text-gray-700 mb-4">
                  We assist users with tax compliance by:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Providing transaction history and records</li>
                  <li>Generating tax reports where applicable</li>
                  <li>Maintaining detailed transaction logs</li>
                  <li>Cooperating with tax authorities when required</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6.2 VAT/GST Compliance</h3>
                <p className="text-gray-700 mb-4">
                  We comply with applicable VAT/GST requirements:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Proper VAT/GST registration where required</li>
                  <li>Accurate tax calculation and collection</li>
                  <li>Timely tax remittance to authorities</li>
                  <li>Compliance with digital services tax rules</li>
                </ul>
              </section>

              {/* Consumer Protection */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Consumer Protection</h2>
                <p className="text-gray-700 mb-4">
                  We implement robust consumer protection measures:
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7.1 Fair Trading Practices</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Transparent pricing and fee disclosure</li>
                  <li>Clear terms and conditions</li>
                  <li>Fair dispute resolution processes</li>
                  <li>Protection against fraudulent activities</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7.2 Accessibility Compliance</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>WCAG 2.1 accessibility standards</li>
                  <li>Screen reader compatibility</li>
                  <li>Keyboard navigation support</li>
                  <li>Multi-language support</li>
                </ul>
              </section>

              {/* Compliance Monitoring */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Compliance Monitoring & Reporting</h2>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">8.1 Compliance Framework</h3>
                <p className="text-gray-700 mb-4">
                  Our compliance framework includes:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Regular compliance assessments</li>
                  <li>Internal audit programs</li>
                  <li>External compliance reviews</li>
                  <li>Continuous monitoring systems</li>
                  <li>Compliance training programs</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">8.2 Regulatory Reporting</h3>
                <p className="text-gray-700 mb-4">
                  We maintain comprehensive reporting procedures:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Suspicious Activity Reports (SARs)</li>
                  <li>Currency Transaction Reports (CTRs)</li>
                  <li>Data breach notifications</li>
                  <li>Regulatory correspondence</li>
                </ul>
              </section>

              {/* Third-Party Compliance */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Third-Party Compliance</h2>
                <p className="text-gray-700 mb-4">
                  We ensure our partners and service providers meet compliance standards:
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">9.1 Vendor Due Diligence</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Comprehensive vendor screening</li>
                  <li>Compliance certification requirements</li>
                  <li>Regular compliance assessments</li>
                  <li>Contractual compliance obligations</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">9.2 Service Provider Oversight</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Ongoing monitoring of service providers</li>
                  <li>Compliance reporting requirements</li>
                  <li>Regular compliance reviews</li>
                  <li>Incident reporting procedures</li>
                </ul>
              </section>

              {/* Compliance Training */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Compliance Training & Awareness</h2>
                <p className="text-gray-700 mb-4">
                  We maintain a comprehensive compliance training program:
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">10.1 Staff Training</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Regular compliance training sessions</li>
                  <li>Role-specific compliance education</li>
                  <li>Annual compliance certifications</li>
                  <li>Updates on regulatory changes</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">10.2 User Education</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Compliance guidelines for users</li>
                  <li>Educational resources and materials</li>
                  <li>Best practices documentation</li>
                  <li>Regular compliance communications</li>
                </ul>
              </section>

              {/* Incident Response */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Compliance Incident Response</h2>
                <p className="text-gray-700 mb-4">
                  We maintain robust incident response procedures:
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">11.1 Incident Detection</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Automated monitoring systems</li>
                  <li>Staff reporting mechanisms</li>
                  <li>User reporting channels</li>
                  <li>External notifications</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">11.2 Response Procedures</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Immediate containment measures</li>
                  <li>Investigation and analysis</li>
                  <li>Regulatory notification</li>
                  <li>Remediation and prevention</li>
                </ul>
              </section>

              {/* Contact Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Compliance Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  For compliance-related inquiries, please contact:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Chief Compliance Officer:</strong> compliance@bcdmarketplace.com<br/>
                    <strong>AML Officer:</strong> aml@bcdmarketplace.com<br/>
                    <strong>Data Protection Officer:</strong> dpo@bcdmarketplace.com<br/>
                    <strong>Legal Department:</strong> legal@bcdmarketplace.com<br/>
                    <strong>Address:</strong> [Company Address]<br/>
                    <strong>Phone:</strong> [Phone Number]
                  </p>
                </div>
              </section>

              {/* Regulatory Updates */}
              <section className="mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Staying Current</h3>
                  <p className="text-blue-800 mb-4">
                    We continuously monitor regulatory developments and update our compliance programs accordingly. Users will be notified of any material changes that may affect their use of our platform.
                  </p>
                  <p className="text-blue-800">
                    For the latest compliance updates and regulatory announcements, please check our platform regularly or subscribe to our compliance newsletter.
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
              <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</a>
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