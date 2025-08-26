// src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { User } from '../types';
import { connectWallet as web3ConnectWallet, getWalletBalance } from '../lib/web3';
import { useToasts } from './ToastContext';

// Define the shape of the authentication credentials for the login function
interface AuthCredentials {
  email: string;
  password?: string;
}

// Define the shape of the registration data
interface RegisterData {
  username: string;
  email: string;
  password: string;
  f_name: string;
  l_name: string;
  phone?: string;
}

// Define the context shape
interface AuthContextType {
  user: User | null;
  token: string | null;
  authIsLoading: boolean;
  isLoggedIn: boolean;
  walletAddress: string | null;
  walletBalance: string | null;
  isWalletConnected: boolean;
  isWalletLoading: boolean;
  error: string | null;
  login: (credentials: AuthCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  connectWallet: () => Promise<string | null>;
  updateWallet: () => Promise<{ success: boolean; error?: string }>;
  disconnectWallet: () => Promise<void>;
  clearError: () => void;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
}

// Create the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [authIsLoading, setAuthIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { addToast } = useToasts();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchBalance = useCallback(async (address: string) => {
    setIsWalletLoading(true);
    try {
      const balance = await getWalletBalance(address);
      setWalletBalance(balance);
      // Cache the balance to localStorage for circuit breaker fallback
      localStorage.setItem(`wallet_balance_${address}`, balance);
    } catch (err: any) {
      console.error("Failed to fetch wallet balance", err);
      
      // For circuit breaker errors, try to use cached balance
      if (err.message?.includes('circuit breaker') || err.message?.includes('MetaMask')) {
        const cachedBalance = localStorage.getItem(`wallet_balance_${address}`);
        if (cachedBalance) {
          console.warn('Using cached wallet balance due to MetaMask circuit breaker');
          setWalletBalance(cachedBalance);
          addToast(
            'MetaMask is temporarily overloaded. Using cached balance.',
            'info',
            'Wallet Connection'
          );
        } else {
          setWalletBalance('0.0'); // Default fallback
          addToast(
            'MetaMask is temporarily overloaded. Please try again in a moment.',
            'error',
            'Wallet Connection'
          );
        }
      } else {
        setWalletBalance(null); // Clear balance on other errors
        addToast(
          'Failed to fetch wallet balance. Please check your connection.',
          'error',
          'Wallet Error'
        );
      }
    } finally {
      setIsWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      const savedWallet = localStorage.getItem('walletAddress');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
      if (savedWallet) {
        setWalletAddress(savedWallet);
        fetchBalance(savedWallet); // Fetch balance for persisted wallet
      }
    } catch (e) {
      console.error("Failed to parse auth data from localStorage", e);
      localStorage.clear(); // Clear corrupted storage
    } finally {
      setAuthIsLoading(false);
    }
  }, [fetchBalance]);

  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          console.log('Wallet disconnected.');
          setWalletAddress(null);
          setWalletBalance(null);
          localStorage.removeItem('walletAddress');
        } else if (accounts[0] !== walletAddress) {
          console.log('Wallet account changed.');
          const newAddress = accounts[0];
          setWalletAddress(newAddress);
          localStorage.setItem('walletAddress', newAddress);
          fetchBalance(newAddress);
        }
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [walletAddress, fetchBalance]);

  const connectWallet = useCallback(async (): Promise<string | null> => {
    setIsWalletLoading(true);
    setError(null);
    try {
      const { address } = await web3ConnectWallet();
      setWalletAddress(address);
      localStorage.setItem('walletAddress', address);
      await fetchBalance(address);
      
      // Save wallet to database if user is logged in
      console.log('🔍 Checking wallet save conditions:', {
        hasUser: !!user,
        userId: user?.id,
        hasToken: !!token,
        walletAddress: address
      });
      
      if (user?.id && token) {
        console.log('✅ User is logged in, attempting to save wallet to database');
        try {
          const requestBody = {
            user_id: user.id,
            wallet_addr: address
          };
          
          console.log('📤 Making POST request to save wallet:', {
            url: `${API_BASE_URL}/wallets`,
            body: requestBody,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token.substring(0, 20)}...`
            }
          });
          
          const response = await fetch(`${API_BASE_URL}/wallets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
          });
          
          console.log('📥 Response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });
          
          const data = await response.json();
          console.log('📋 Response data:', data);
          
          if (!data.success) {
            console.warn('❌ Failed to save wallet to database:', data.error);
            // Don't throw error here as wallet connection was successful
          } else {
            console.log('✅ Wallet saved to database successfully:', data);
          }
        } catch (dbError: any) {
          console.error('💥 Error saving wallet to database:', {
            message: dbError.message,
            stack: dbError.stack,
            error: dbError
          });
          // Don't throw error here as wallet connection was successful
        }
      } else {
        console.log('⚠️ Cannot save wallet - user not logged in or missing token');
      }
      
      return address;
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet.');
      console.error(err);
      return null;
    } finally {
      setIsWalletLoading(false);
    }
  }, [fetchBalance, user, token]);

  const updateWallet = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id || !token) {
      return { success: false, error: 'User not logged in' };
    }

    setIsWalletLoading(true);
    setError(null);

    try {
      // Get current MetaMask address
      const { address } = await web3ConnectWallet();
      
      console.log('🔄 Updating wallet address:', {
        userId: user.id,
        newAddress: address,
        currentAddress: walletAddress
      });

      // Update wallet in database
      const requestBody = {
        user_id: user.id,
        wallet_addr: address
      };

      const response = await fetch(`${API_BASE_URL}/wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!data.success) {
        console.error('❌ Failed to update wallet in database:', data.error);
        return { success: false, error: data.error || 'Failed to update wallet in database' };
      }

      // Update local state
      setWalletAddress(address);
      localStorage.setItem('walletAddress', address);
      await fetchBalance(address);

      console.log('✅ Wallet updated successfully:', address);
      return { success: true };

    } catch (err: any) {
      console.error('💥 Error updating wallet:', err);
      const errorMessage = err.message || 'Failed to update wallet';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsWalletLoading(false);
    }
  }, [user, token, walletAddress, fetchBalance]);

  const disconnectWallet = async () => {
    setIsWalletLoading(true);
    setError(null);

    try {
      // If user is logged in, try to remove wallet from database
      if (user?.id && token) {
        try {
          const response = await fetch(`${API_BASE_URL}/wallets/user/${user.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          const data = await response.json();
          
          if (!data.success) {
            console.warn('Failed to disconnect wallet from database:', data.error);
            // Continue with local disconnection even if database operation fails
          } else {
            console.log('Wallet disconnected from database successfully.');
          }
        } catch (dbError: any) {
          console.warn('Error disconnecting wallet from database:', dbError.message);
          // Continue with local disconnection even if database operation fails
        }
      }

      // Always clear local state and storage
      setWalletAddress(null);
      setWalletBalance(null);
      localStorage.removeItem('walletAddress');
      
      console.log('Wallet disconnected locally.');

      // Trigger MetaMask reconnection popup
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        try {
          await ethereum.request({ method: 'eth_requestAccounts' });
          console.log('MetaMask reconnection prompted.');
        } catch (metamaskError: any) {
          console.error('MetaMask reconnection failed:', metamaskError);
          // Don't throw error here as wallet was successfully disconnected locally
        }
      } else {
        console.warn('MetaMask not detected for reconnection.');
      }

    } catch (err: any) {
      console.error('Error disconnecting wallet:', err);
      setError(err.message || 'Failed to disconnect wallet');
    } finally {
      setIsWalletLoading(false);
    }
  };

  const login = async (credentials: AuthCredentials): Promise<boolean> => {
    setAuthIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      const { user: loggedInUser, token: authToken } = data.data;

      // Check if user status is active
      if (loggedInUser.status !== 'active') {
        throw new Error('Account is not active. Please contact support.');
      }

      setUser(loggedInUser);
      setToken(authToken);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      localStorage.setItem('token', authToken);
      
      router.push(loggedInUser.user_role === 'admin' ? '/admin' : '/profile');
      return true;

    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setAuthIsLoading(false);
    }
  };

  const verifyEmail = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      return {
        success: data.success,
        error: data.success ? undefined : (data.error || 'Email verification failed')
      };
    } catch (err: any) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return {
        success: data.success,
        error: data.success ? undefined : (data.error || 'Failed to resend verification email')
      };
    } catch (err: any) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    setAuthIsLoading(true);
    setError(null);

    try {
      console.log('Making API call to:', `${API_BASE_URL}/auth/register`);
      console.log('With data:', userData);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);

      if (response.ok && data.success) {
        return { success: true };
      } else {
        const errorMessage = data.error || data.message || 'Registration failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err: any) {
      console.error('Network error in register function:', err);
      const errorMessage = err.message || 'Network error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setAuthIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Note: We keep the wallet connected on logout by default
    router.push('/auth');
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    token,
    authIsLoading,
    isLoggedIn: !!token,
    walletAddress,
    walletBalance,
    isWalletConnected: !!walletAddress,
    isWalletLoading,
    error,
    login,
    register,
    logout,
    connectWallet,
    updateWallet,
    disconnectWallet,
    clearError,
    verifyEmail,
    resendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {!authIsLoading && children}
    </AuthContext.Provider>
  );
};