// src/components/Header.tsx

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import { User, UserRole } from '../types';

// Helper to get user initials for the avatar
const getInitials = (user: User) => {
    const first = user.f_name?.[0] || '';
    const last = user.l_name?.[0] || '';
    if (first && last) return `${first}${last}`.toUpperCase();
    return user.username.substring(0, 2).toUpperCase();
};

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    // Single hook for all auth and wallet state
    const {
        user,
        isLoggedIn,
        isWalletConnected,
        walletAddress,
        authIsLoading: isConnecting, // Renaming for clarity in this component
        connectWallet,
        logout,
    } = useAuth();

    const { cartCount } = useCart();

    const isAdmin = user?.user_role === UserRole.Admin;

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                            BCD Marketplace
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        <Link href="/products" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium">
                            Browse
                        </Link>
                        <Link href={isLoggedIn ? "/sell" : "/auth"} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium">
                            Sell
                        </Link>
                        {isAdmin && (
                            <Link href="/admin" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium flex items-center">
                                <span className="mr-1">🛡️</span> Admin
                            </Link>
                        )}
                    </nav>

                    {/* User Actions */}
                    <div className="flex items-center space-x-4">

                        {/* Show Cart ONLY if logged in */}
                        {isLoggedIn && (
                            <Link href="/cart" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 relative p-2">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
                                </svg>
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {isLoggedIn && user ? (
                            // --- Logged In State ---
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="flex items-center space-x-2 text-gray-700 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                        {getInitials(user)}
                                    </div>
                                </button>
                                {isProfileDropdownOpen && (
                                    <div
                                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                                        onMouseLeave={() => setIsProfileDropdownOpen(false)}
                                    >
                                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.username}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                        </div>
                                        <div className='py-1'>
                                            <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">My Account</Link>
                                            <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">My Orders</Link>
                                        </div>
                                        <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                                            {isWalletConnected && walletAddress ? (
                                                <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <p className='font-medium'>Wallet Connected</p>
                                                    <p className='truncate'>{walletAddress}</p>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={connectWallet}
                                                    disabled={isConnecting}
                                                    className="block w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                                                >
                                                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                                                </button>
                                            )}
                                        </div>
                                        <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                                            <button
                                                onClick={logout}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // --- Logged Out State ---
                            <div className="flex items-center space-x-3">
                                <Link href="/auth" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                                    Login / Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;