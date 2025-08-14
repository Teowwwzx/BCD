// src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '../types'; // Using the corrected types from index.ts
import { connectWallet as web3ConnectWallet } from '../lib/web3';

// Define the shape of the authentication credentials for the login function
interface AuthCredentials {
  email: string;
  password?: string; // Password can be optional for wallet-only sign-in later
}

// Define the context shape
interface AuthContextType {
  user: User | null;
  token: string | null;
  authIsLoading: boolean;
  isLoggedIn: boolean;
  walletAddress: string | null;
  isWalletConnected: boolean;
  error: string | null;
  login: (credentials: AuthCredentials) => Promise<boolean>;
  logout: () => void;
  connectWallet: () => Promise<string | null>;
  clearError: () => void;
}

// Create the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [authIsLoading, setAuthIsLoading] = useState(true); // True initially to check storage
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // API base URL from environment variables
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Effect to rehydrate state from localStorage on initial load
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
      }
    } catch (e) {
      console.error("Failed to parse auth data from localStorage", e);
      // Clear potentially corrupted storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('walletAddress');
    } finally {
      setAuthIsLoading(false);
    }
  }, []);

  // Effect to handle wallet events (account or network changes)
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // MetaMask is locked or user has disconnected all accounts
          console.log('Wallet disconnected.');
          logout(); // Log out the user if their wallet disconnects
        } else if (accounts[0] !== walletAddress) {
          // User has switched accounts
          console.log('Wallet account changed.');
          logout(); // Force re-login on account switch for security
          router.push('/auth');
        }
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [walletAddress, router]); // Dependency array includes router now

  const connectWallet = useCallback(async (): Promise<string | null> => {
    setAuthIsLoading(true);
    setError(null);
    try {
      const { address } = await web3ConnectWallet();
      setWalletAddress(address);
      localStorage.setItem('walletAddress', address);
      return address;
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet.');
      console.error(err);
      return null;
    } finally {
      setAuthIsLoading(false);
    }
  }, []);

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

      // Connect wallet if not already connected
      const connectedAddress = walletAddress || await connectWallet();
      if (!connectedAddress) {
          throw new Error("Wallet connection is required to log in.");
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
    setWalletAddress(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('walletAddress');
    router.push('/auth');
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    token,
    authIsLoading,
    isLoggedIn: !!token,
    walletAddress,
    isWalletConnected: !!walletAddress,
    error,
    login,
    logout,
    connectWallet,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {!authIsLoading && children}
    </AuthContext.Provider>
  );
};