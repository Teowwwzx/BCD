'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connectWallet as web3ConnectWallet, getProvider } from '../lib/web3';

interface User {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  isVerified: boolean;
  joinDate: string;
  userRole?: string;
  totalOrders?: number;
  totalSpent?: string;
}

interface WalletContextType {
  isWalletConnected: boolean;
  walletAddress: string;
  user: User | null;
  isLoggedIn: boolean;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved state from localStorage on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window === 'undefined') return;
      
      const savedWalletState = localStorage.getItem('walletConnected');
      const savedWalletAddress = localStorage.getItem('walletAddress');
      const savedUser = localStorage.getItem('user');
      const savedLoginState = localStorage.getItem('isLoggedIn');

      if (savedWalletState === 'true' && savedWalletAddress && window.ethereum) {
        try {
          // Check if the wallet is still connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts.length > 0 && accounts[0].toLowerCase() === savedWalletAddress.toLowerCase()) {
            setIsWalletConnected(true);
            setWalletAddress(savedWalletAddress);
          } else {
            // Wallet was disconnected, clear saved data
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('walletAddress');
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err);
          localStorage.removeItem('walletConnected');
          localStorage.removeItem('walletAddress');
        }
      }

      if (savedLoginState === 'true' && savedUser) {
        setIsLoggedIn(true);
        setUser(JSON.parse(savedUser));
      }
    };

    checkWalletConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        disconnectWallet();
      } else if (accounts[0] !== walletAddress) {
        // User switched accounts
        setWalletAddress(accounts[0]);
        localStorage.setItem('walletAddress', accounts[0]);
      }
    };

    const handleChainChanged = () => {
      // Reload the page when chain changes
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [walletAddress]);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Check if MetaMask is installed
      if (typeof window !== 'undefined' && !window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      const address = await web3ConnectWallet();
      setIsWalletConnected(true);
      setWalletAddress(address);
      
      // Save to localStorage
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', address);
      
      console.log('Wallet connected successfully:', address);
      
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      setIsWalletConnected(false);
      setWalletAddress('');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setWalletAddress('');
    setError(null);
    
    // Remove from localStorage
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    
    console.log('Wallet disconnected');
  };

  const clearError = () => {
    setError(null);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - in real app, this would come from API
      let mockUser: User;
      
      // Check for admin credentials
      if (email === 'admin@bcdmarketplace.com' && password === 'admin123') {
        mockUser = {
          id: '1',
          name: 'Admin User',
          email: email,
          walletAddress: '0x1234567890123456789012345678901234567890',
          isVerified: true,
          joinDate: '2024-01-01',
          userRole: 'Admin',
          totalOrders: 0,
          totalSpent: '0 ETH'
        };
      } else if (email === 'superadmin@bcdmarketplace.com' && password === 'superadmin123') {
        mockUser = {
          id: '2',
          name: 'Super Admin',
          email: email,
          walletAddress: '0x2345678901234567890123456789012345678901',
          isVerified: true,
          joinDate: '2024-01-01',
          userRole: 'Admin',
          totalOrders: 0,
          totalSpent: '0 ETH'
        };
      } else {
        // Regular user
        mockUser = {
          id: '3',
          name: 'John Doe',
          email: email,
          walletAddress: walletAddress || '',
          isVerified: true,
          joinDate: '2024-01-15',
          userRole: 'Retailer',
          totalOrders: 3,
          totalSpent: '0.38 ETH'
        };
      }
      
      setUser(mockUser);
      setIsLoggedIn(true);
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('isLoggedIn', 'true');
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (userData.password !== userData.confirmPassword) {
        alert('Passwords do not match');
        return false;
      }
      
      // Mock user creation - in real app, this would be an API call
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        walletAddress: walletAddress || '',
        isVerified: false,
        joinDate: new Date().toISOString().split('T')[0],
        userRole: 'Retailer',
        totalOrders: 0,
        totalSpent: '0 ETH'
      };
      
      setUser(newUser);
      setIsLoggedIn(true);
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('isLoggedIn', 'true');
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    
    // Remove from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    
    console.log('User logged out');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: WalletContextType = {
    isWalletConnected,
    walletAddress,
    user,
    isLoggedIn,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    login,
    register,
    logout,
    updateUser,
    clearError
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}