'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '../contexts/WalletContext';
import { useCart } from '../contexts/CartContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { 
    isWalletConnected, 
    user, 
    isLoggedIn, 
    connectWallet, 
    disconnectWallet, 
    logout 
  } = useWallet();
  const { cartCount } = useCart();

  const handleLogout = () => {
    logout();
    disconnectWallet();
    setIsProfileDropdownOpen(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <a href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                BCD Marketplace
              </a>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="/products" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">
              Browse
            </a>
            <a href="/sell" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">
              Sell
            </a>
            {user?.userRole === 'Admin' && (
              <a href="/admin" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-3 py-2 text-sm font-medium transition-colors flex items-center">
                <span className="mr-1">🛡️</span>
                Admin
              </a>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-6">
            {/* Shopping Cart */}
            <a href="/cart" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 relative transition-colors p-2">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
              </svg>
              {/* Cart badge */}
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </a>

            {/* Profile Section */}
            {isLoggedIn && user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  onMouseEnter={() => setIsProfileDropdownOpen(true)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
                >
                  {/* Profile Avatar */}
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {getInitials(user.name)}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{user.name.split(' ')[0]}</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                    onMouseLeave={() => setIsProfileDropdownOpen(false)}
                  >
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>My Account</span>
                      </div>
                    </Link>
                    <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>My Orders</span>
                      </div>
                    </Link>
                    <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Settings</span>
                      </div>
                    </Link>
                    {isWalletConnected && (
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <div className="px-4 py-2 text-xs text-gray-500 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Wallet Connected</span>
                        </div>
                      </div>
                    )}
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Sign Out</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                {!isWalletConnected && (
                  <button 
                    onClick={connectWallet}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    Connect Wallet
                  </button>
                )}
                <Link href="/auth">
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                    Sign In
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Mobile Navigation */}
            <a href="/products" className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg">
              Browse
            </a>
            <a href="/sell" className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg">
              Sell
            </a>
            <a href="/cart" className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg">
              Cart
            </a>
            
            {/* Mobile User Section */}
            {isLoggedIn && user ? (
              <div className="border-t border-gray-200 mt-3 pt-3">
                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      {isWalletConnected && (
                        <div className="text-xs text-gray-500 flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Wallet Connected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <a href="/profile" className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg">
                  My Account
                </a>
                <a href="/orders" className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg">
                  My Orders
                </a>
                <a href="/settings" className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg">
                  Settings
                </a>
                {user?.userRole === 'Admin' && (
                  <a href="/admin" className="block px-3 py-2 text-red-600 hover:text-red-700 transition-colors rounded-lg">
                    🛡️ Admin Dashboard
                  </a>
                )}
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-red-600 hover:text-red-700 transition-colors rounded-lg mt-2"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-200 mt-3 pt-3 space-y-2">
                {!isWalletConnected && (
                  <button 
                    onClick={connectWallet}
                    className="block w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Connect Wallet
                  </button>
                )}
                <Link href="/auth">
                  <button className="block w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                    Sign In
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;