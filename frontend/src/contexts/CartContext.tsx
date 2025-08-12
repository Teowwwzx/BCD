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
  addToCart: (productId: number, quantity?: number) => Promise<boolean>;
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
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // 3. Centralized API call handler for DRY principle
  const handleApiCall = async (endpoint: string, options: RequestInit) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart${endpoint}`, options);
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
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

  const addToCart = async (productId: number, quantity: number = 1): Promise<boolean> => {
    if (!user) {
      alert('Please log in to add items to your cart.');
      return false;
    }

    const result = await handleApiCall('/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, productId, quantity }),
    });

    if (result) {
      await fetchCart(); // Refetch the cart to update state
      return true;
    }
    return false;
  };

  const updateCartItem = async (productId: number, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) { // If quantity is 0 or less, remove the item
        await removeFromCart(productId);
        return;
    }

    const result = await handleApiCall('/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, productId, quantity }),
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

  const value: CartContextType = {
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