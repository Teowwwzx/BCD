// src/cart/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function CartPage() {
  const { isLoggedIn, isWalletConnected, walletAddress, connectWallet, user } = useAuth();
  const { cartItems, updateCartItem, removeFromCart, clearCart, loading, error } = useCart();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Handle authentication state loading and redirect
  useEffect(() => {
    // Give time for localStorage to load
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!isLoggedIn) {
        router.push('/auth');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isLoggedIn, router]);

  // Cart items are now managed by CartContext

  if (isLoading || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{isLoading ? 'Loading...' : 'Redirecting to login...'}</p>
        </div>
      </div>
    );
  }

  const updateQuantity = async (productId: number, newQuantity: number) => {
    if (newQuantity < 0) return; // Prevent negative quantities

    setActionLoading(productId);
    try {
      if (newQuantity === 0) {
        await removeFromCart(productId);
      } else {
        await updateCartItem(productId, newQuantity);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Error will be displayed via the error state from CartContext
    } finally {
      setActionLoading(null);
    }
  };

  const removeItem = async (productId: number) => {
    setActionLoading(productId);
    try {
      await removeFromCart(productId);
    } catch (error) {
      console.error('Error removing item:', error);
      // Error will be displayed via the error state from CartContext
    } finally {
      setActionLoading(null);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = Number(item.product.price) || 0;
      return total + (price * item.quantity);
    }, 0).toFixed(2);
  };

  const handleCheckout = async () => {
    if (!isWalletConnected) {
      alert('Please connect your wallet to proceed with checkout');
      return;
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setCheckoutLoading(true);
    
    // Navigate to checkout page where the actual order creation and payment will be handled
    router.push('/checkout');
    
    setCheckoutLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">{cartItems.length} items in your cart</p>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-2 text-gray-500">Start shopping to add items to your cart</p>
            <a
              href="/products"
              className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </a>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-black" style={{color: 'black !important'}}>Cart Items</h2>
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          {item.product.images?.[0]?.imageUrl ? (
                            <img
                              src={item.product.images[0].imageUrl}
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-black" style={{color: '#000000 !important'}}>{item.product.name}</h3>
                          <p className="text-sm text-black" style={{color: '#000000 !important'}}>Product ID: {item.product.id}</p>
                          <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full mt-2">
                            Electronics
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading || actionLoading === item.productId}
                          >
                            {actionLoading === item.productId ? (
                              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              '-'
                            )}
                          </button>
                          <span className="w-8 text-center font-medium text-black" style={{color: '#000000 !important'}}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading || actionLoading === item.productId}
                          >
                            {actionLoading === item.productId ? (
                              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              '+'
                            )}
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-black" style={{color: '#000000 !important'}}>
                            ${(Number(item.product.price) || 0).toFixed(2)}
                          </p>
                          <p className="text-sm text-black" style={{color: '#000000 !important'}}>
                            Total: ${((Number(item.product.price) || 0) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-red-500 hover:text-red-700 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loading || actionLoading === item.productId}
                          title="Remove item from cart"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h2 className="text-xl font-semibold mb-4 text-black" style={{color: 'black !important'}}>Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-black" style={{color: '#000000 !important'}}>Subtotal</span>
                    <span className="font-medium text-black" style={{color: '#000000 !important'}}>${calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black" style={{color: '#000000 !important'}}>Platform Fee (2.5%)</span>
                    <span className="font-medium text-black" style={{color: '#000000 !important'}}>${(parseFloat(calculateTotal()) * 0.025).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black" style={{color: '#000000 !important'}}>Shipping</span>
                    <span className="font-medium text-black" style={{color: '#000000 !important'}}>Free</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-black" style={{color: '#000000 !important'}}>Total</span>
                      <span className="text-black" style={{color: '#000000 !important'}}>
                        ${(parseFloat(calculateTotal()) * 1.025).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {isWalletConnected ? (
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading || cartItems.length === 0}
                    className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
                  </button>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Connect Wallet to Checkout
                  </button>
                )}

                <div className="mt-4 space-y-2">
                  <div className="text-center">
                    <a
                      href="/products"
                      className="text-black hover:text-blue-700 text-sm"
                      style={{color: '#000000 !important'}}
                    >
                      Continue Shopping
                    </a>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear your cart? This action cannot be undone.')) {
                        clearCart();
                      }
                    }}
                    className="w-full text-red-600 hover:text-red-700 text-sm py-2 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || cartItems.length === 0}
                  >
                    Clear Cart
                  </button>
                </div>

                {/* Security Notice */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-black" style={{color: '#000000 !important'}}>Secure Checkout</h4>
                      <p className="text-xs text-black mt-1" style={{color: '#000000 !important'}}>
                        All transactions are secured by blockchain technology and smart contracts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}