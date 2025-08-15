// frontend/src/contexts/CartContext.tsx

'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth'; // Our source of truth for the logged-in user
import type { CartItem } from '../types'; // The type defined in our central types file

// 1. Define a more complete "menu" for our context
interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  loading: boolean; // A general loading state for the initial fetch
  error: string | null;
  addToCart: (productId: number, quantity: number, stock: number) => Promise<void>;
  updateCartItem: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refetchCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// 2. Create the custom hook for components to use.
// This follows our rule: NEVER use `useContext(CartContext)` directly in pages.
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // Get the user from our central auth hook
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true); // For initial load
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // 3. Centralized API call handler for DRY principle
  const handleApiCall = async (endpoint: string, options: RequestInit) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/cart${endpoint}`, options);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'An API error occurred.');
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      console.error(`Cart API Error (${endpoint}):`, err);
      return null;
    }
  };

  // Function to fetch the entire cart state
  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setCartCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await handleApiCall(`/${user.id}`, { method: 'GET' });
    if (result) {
      setCartItems(result.data.items || []);
      setCartCount(result.data.totalItems || 0);
    }
    setLoading(false);
  }, [user]);

  // Fetch cart data when the user logs in or out
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // --- Public Functions ---

  const addToCart = async (productId: number, quantity: number, stock: number) => {
    if (!user) return alert('Please log in to add items to your cart.');

    // Client-side stock check for immediate feedback
    const existingItem = cartItems.find(item => item.product.id === productId);
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
    if (currentQuantityInCart + quantity > stock) {
      const errorMessage = `Cannot add item. Only ${stock} available in stock.`;
      setError(errorMessage);
      alert(errorMessage);
      return;
    }

    const result = await handleApiCall('/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, productId, quantity }),
    });

    if (result) await fetchCart();
  };

  const updateCartItem = async (productId: number, newQuantity: number) => {
    if (!user) return;
    
    setError(null);
    const itemToUpdate = cartItems.find(item => item.productId === productId);

    // --- LOGIC: Check stock before updating ---
    if (itemToUpdate && newQuantity > itemToUpdate.product.stock_quantity) {
      const errorMessage = `Cannot update quantity. Only ${itemToUpdate.product.stock_quantity} items are in stock.`;
      setError(errorMessage);
      alert(errorMessage);
      return;
    }

    const result = await handleApiCall('/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, productId, quantity: newQuantity }),
    });

    if (result) await fetchCart();
  };

  const removeFromCart = async (productId: number) => {
    if (!user) return;

    const result = await handleApiCall('/remove', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, productId }),
    });

    if (result) await fetchCart();
  };

  const clearCart = async () => {
    if (!user) return;

    const result = await handleApiCall(`/clear/${user.id}`, { method: 'DELETE' });

    if (result) {
      setCartItems([]);
      setCartCount(0);
    }
  };

  const value = {
    cartItems,
    cartCount,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refetchCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};