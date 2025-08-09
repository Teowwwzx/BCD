'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '../types';
import { connectWallet as web3ConnectWallet } from '../lib/web3'; // Import wallet functions


// 1. Define the new, unified context type
interface AuthContextType {
  // User Session State
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Wallet State
  walletAddress: string;
  isWalletConnected: boolean;
  isConnecting: boolean;
  
  // Functions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  connectWallet: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // User Session State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 2. Add Wallet State
  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // Rehydrate state from localStorage on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    const savedWalletAddress = localStorage.getItem('walletAddress');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    if (savedWalletAddress) {
        setWalletAddress(savedWalletAddress);
        setIsWalletConnected(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (data.success) {
        const loggedInUser = data.data.user;
        setUser(loggedInUser);
        setToken(data.data.token);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        localStorage.setItem('token', data.data.token);

        if (!isWalletConnected) await connectWallet();
        if (loggedInUser.user_role === 'admin') router.push('/admin');
        else router.push('/profile');
        return true;
      } else {
        setError(data.error || 'Login failed');
        return false;
      }
    } catch (err) {
      setError('An error occurred during login.');
      setIsLoading(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // const register = async (userData: RegisterData) => {
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(userData),
  //     });
  //     const data = await response.json();
  //     if (data.success) {
  //       // Automatically log in the user after successful registration
  //       return await login(userData.email, userData.password);
  //     } else {
  //       setError(data.error || 'Registration failed');
  //       setIsLoading(false);
  //       return false;
  //     }
  //   } catch (err) {
  //     setError('An error occurred during registration.');
  //     setIsLoading(false);
  //     return false;
  //   }
  // };

  const logout = () => {
    // Clear both user session and wallet state
    setUser(null);
    setToken(null);
    setWalletAddress('');
    setIsWalletConnected(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('walletAddress');
    router.push('/auth');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const clearError = () => setError(null);

  // 3. Add wallet connection logic
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

  return (
    <AuthContext.Provider value={{
      // User Session
      user,
      token,
      isLoggedIn: !!token,
      isLoading,
      error,
      login,
      logout,
      updateUser,
      clearError,
      // Wallet
      walletAddress,
      isWalletConnected,
      isConnecting,
      connectWallet,
    }}>
      {children}
    </AuthContext.Provider>
  );
};