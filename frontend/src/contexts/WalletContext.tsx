// frontend/src/contexts/AuthContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { connectWallet as web3ConnectWallet } from '../lib/web3';
import { User } from '../types'; // Import our central User type

// 1. A unified context type for both wallet and user session
interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean; // General loading for auth state
  isConnecting: boolean; // Specific loading for wallet connection
  walletAddress: string;
  isWalletConnected: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. The official hook for our application, as per our rules
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start true to check localStorage
  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // 3. Rehydrate state from localStorage on initial load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      }
      
      const storedWalletAddress = localStorage.getItem('walletAddress');
      if (storedWalletAddress) {
        setWalletAddress(storedWalletAddress);
        setIsWalletConnected(true);
      }
    } catch (err) {
      console.error("Failed to parse auth state from localStorage", err);
      // Clear potentially corrupted storage
      localStorage.removeItem('user');
      localStorage.removeItem('walletAddress');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const clearError = () => setError(null);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const { address } = await web3ConnectWallet();
      setWalletAddress(address);
      setIsWalletConnected(true);
      localStorage.setItem('walletAddress', address);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet.');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    // Disconnecting the wallet also means logging out the user
    setUser(null);
    setIsLoggedIn(false);
    setWalletAddress('');
    setIsWalletConnected(false);
    localStorage.removeItem('user');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('isLoggedIn'); // Ensure this is cleared
    router.push('/'); // Navigate to home on disconnect/logout
  }, [router]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this would be a POST request
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, walletAddress })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      const loggedInUser: User = result.data.user;
      setUser(loggedInUser);
      setIsLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      localStorage.setItem('isLoggedIn', 'true');
      return true;

    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    disconnectWallet(); // The logout process is the same as disconnecting
  };
  
  // MetaMask event listeners
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setWalletAddress(accounts[0]);
        localStorage.setItem('walletAddress', accounts[0]);
      }
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [walletAddress, disconnectWallet]);

  const value = {
    user,
    isLoggedIn,
    isLoading,
    isConnecting,
    walletAddress,
    isWalletConnected,
    error,
    connectWallet,
    disconnectWallet,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};