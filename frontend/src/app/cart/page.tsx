'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '../../contexts/WalletContext';
import { useCart } from '../../contexts/CartContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function CartPage() {
  const { isLoggedIn, isWalletConnected, walletAddress, connectWallet } = useWallet();
  const { cartItems, updateCartItem, removeFromCart, clearCart, loading } = useCart();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Mock user ID for demo purposes (in real app, this would come from auth context)
  const MOCK_USER_ID = 1;
  
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
    if (newQuantity === 0) {
      await removeFromCart(productId);
      return;
    }
    await updateCartItem(productId, newQuantity);
  };

  const removeItem = async (productId: number) => {
    await removeFromCart(productId);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.product.priceEth || item.product.price || 0;
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
    
    try {
      const response = await fetch('http://localhost:5000/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyerId: MOCK_USER_ID,
          shippingAddress: 'Digital delivery', // For digital products
          paymentMethod: 'ETH'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Checkout successful! ${data.orderCount} orders created. Total: ${data.totalAmount.toFixed(4)} ETH`);
        // Refresh cart to show empty state
        window.location.reload();
      } else {
        alert(`Checkout failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred during checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">{cartItems.length} items in your cart</p>
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
                  <h2 className="text-xl font-semibold mb-4">Cart Items</h2>
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          {item.product.imageUrl ? (
                            <img 
                              src={item.product.imageUrl} 
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
                          <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                          <p className="text-sm text-gray-600">Product ID: {item.product.id}</p>
                          <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full mt-2">
                            Electronics
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                            disabled={loading}
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                            disabled={loading}
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">
                            {item.product.priceEth ? `${item.product.priceEth} ETH` : `$${item.product.price || 0}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            Total: {item.product.priceEth ? 
                              `${(item.product.priceEth * item.quantity).toFixed(4)} ETH` : 
                              `$${((item.product.price || 0) * item.quantity).toFixed(2)}`
                            }
                          </p>
                        </div>
                        <button 
                          onClick={() => removeItem(item.productId)}
                          className="text-red-500 hover:text-red-700 p-2"
                          disabled={loading}
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
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{calculateTotal()} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee (2.5%)</span>
                    <span className="font-medium">{(parseFloat(calculateTotal()) * 0.025).toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gas Fee (Est.)</span>
                    <span className="font-medium">0.002 ETH</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-blue-600">
                        {(parseFloat(calculateTotal()) * 1.025 + 0.002).toFixed(4)} ETH
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
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Continue Shopping
                    </a>
                  </div>
                  <button 
                    onClick={() => clearCart()}
                    className="w-full text-red-600 hover:text-red-700 text-sm py-2 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    disabled={loading}
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
                      <h4 className="text-sm font-medium text-green-800">Secure Checkout</h4>
                      <p className="text-xs text-green-700 mt-1">
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