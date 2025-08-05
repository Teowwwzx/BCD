'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
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

  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedWalletState = localStorage.getItem('walletConnected');
    const savedWalletAddress = localStorage.getItem('walletAddress');
    const savedUser = localStorage.getItem('user');
    const savedLoginState = localStorage.getItem('isLoggedIn');

    if (savedWalletState === 'true' && savedWalletAddress) {
      setIsWalletConnected(true);
      setWalletAddress(savedWalletAddress);
    }

    if (savedLoginState === 'true' && savedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (accounts.length > 0) {
          const address = accounts[0];
          setIsWalletConnected(true);
          setWalletAddress(address);
          
          // Save to localStorage
          localStorage.setItem('walletConnected', 'true');
          localStorage.setItem('walletAddress', address);
          
          console.log('Wallet connected successfully:', address);
        }
      } else {
        alert('Please install MetaMask or another Web3 wallet');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setWalletAddress('');
    
    // Remove from localStorage
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    
    console.log('Wallet disconnected');
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
    connectWallet,
    disconnectWallet,
    login,
    register,
    logout,
    updateUser
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