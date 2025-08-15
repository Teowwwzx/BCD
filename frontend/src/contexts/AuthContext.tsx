// src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { User } from '../types';
import { connectWallet as web3ConnectWallet, getWalletBalance } from '../lib/web3';

// Define the shape of the authentication credentials for the login function
interface AuthCredentials {
  email: string;
  password?: string;
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
  logout: () => void;
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => void;
  clearError: () => void;
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

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchBalance = useCallback(async (address: string) => {
    setIsWalletLoading(true);
    try {
      const balance = await getWalletBalance(address);
      setWalletBalance(balance);
    } catch (err) {
      console.error("Failed to fetch wallet balance", err);
      setWalletBalance(null); // Clear balance on error
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
      return address;
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet.');
      console.error(err);
      return null;
    } finally {
      setIsWalletLoading(false);
    }
  }, [fetchBalance]);

  const disconnectWallet = () => {
    setWalletAddress(null);
    setWalletBalance(null);
    localStorage.removeItem('walletAddress');
    console.log('Wallet disconnected.');
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
    logout,
    connectWallet,
    disconnectWallet,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {!authIsLoading && children}
    </AuthContext.Provider>
  );
};