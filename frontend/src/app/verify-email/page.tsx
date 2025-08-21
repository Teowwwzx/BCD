'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const token = searchParams.get('token');
    const userEmail = searchParams.get('email');
    
    if (userEmail) {
      setEmail(userEmail);
    }
    
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setMessage('Your email has been successfully verified! You can now log in to your account.');
      } else {
        if (data.error?.includes('expired') || data.error?.includes('invalid')) {
          setStatus('expired');
          setMessage('This verification link has expired or is invalid. Please request a new verification email.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Email verification failed. Please try again.');
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  const resendVerification = async () => {
    if (!email) {
      setMessage('Email address not found. Please try registering again.');
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('A new verification email has been sent to your email address. Please check your inbox.');
      } else {
        setMessage(data.error || 'Failed to resend verification email. Please try again.');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />;
      case 'error':
      case 'expired':
        return <XCircleIcon className="w-16 h-16 text-red-500 mx-auto" />;
      case 'loading':
      default:
        return (
          <div className="w-16 h-16 mx-auto">
            <ArrowPathIcon className="w-16 h-16 text-blue-500 animate-spin" />
          </div>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
      case 'expired':
        return 'text-red-600';
      case 'loading':
      default:
        return 'text-blue-600';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'success':
        return 'Email Verified!';
      case 'error':
        return 'Verification Failed';
      case 'expired':
        return 'Link Expired';
      case 'loading':
      default:
        return 'Verifying Email...';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-20 pb-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            {getStatusIcon()}
            
            <h1 className={`text-2xl font-bold mt-4 mb-2 ${getStatusColor()}`}>
              {getStatusTitle()}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {message}
            </p>

            <div className="space-y-4">
              {status === 'success' && (
                <button
                  onClick={() => router.push('/auth')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Back to Login
                </button>
              )}
              {status === 'expired' && (
                <button
                  onClick={() => router.push('/signup')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Register again
                </button>
              )}

              {(status === 'expired' || status === 'error') && email && (
                <button
                  onClick={resendVerification}
                  disabled={isResending}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? (
                    <div className="flex items-center justify-center">
                      <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Sending...
                    </div>
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}