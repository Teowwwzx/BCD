'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartItem {
  id: number;
  productId: number;
  userId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price?: number;
    priceEth?: number;
    priceUsd?: number;
    imageUrl?: string;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  loading: boolean;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateCartItem: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

const API_BASE_URL = 'http://localhost:5000/api';
const MOCK_USER_ID = 1; // For demo purposes

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch cart items
  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/cart/${MOCK_USER_ID}`);
      const data = await response.json();
      
      if (data.success) {
        setCartItems(data.data.items || []);
      } else {
        console.error('Failed to fetch cart items:', data.error);
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart count
  const fetchCartCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/count/${MOCK_USER_ID}`);
      const data = await response.json();
      
      if (data.success) {
        setCartCount(data.data.cartCount || 0);
      } else {
        console.error('Failed to fetch cart count:', data.error);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  // Add item to cart
  const addToCart = async (productId: number, quantity: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: MOCK_USER_ID,
          productId,
          quantity,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchCartItems();
        await fetchCartCount();
      } else {
        console.error('Failed to add to cart:', data.error);
        alert('Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding item to cart');
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (productId: number, quantity: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/cart/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: MOCK_USER_ID,
          productId,
          quantity,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchCartItems();
        await fetchCartCount();
      } else {
        console.error('Failed to update cart item:', data.error);
        alert('Failed to update cart item');
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      alert('Error updating cart item');
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/cart/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: MOCK_USER_ID,
          productId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchCartItems();
        await fetchCartCount();
      } else {
        console.error('Failed to remove from cart:', data.error);
        alert('Failed to remove item from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Error removing item from cart');
    } finally {
      setLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/cart/clear/${MOCK_USER_ID}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCartItems([]);
        setCartCount(0);
      } else {
        console.error('Failed to clear cart:', data.error);
        alert('Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert('Error clearing cart');
    } finally {
      setLoading(false);
    }
  };

  // Refresh cart data
  const refreshCart = async () => {
    await fetchCartItems();
    await fetchCartCount();
  };

  // Load cart data on mount
  useEffect(() => {
    fetchCartItems();
    fetchCartCount();
  }, []);

  const value: CartContextType = {
    cartItems,
    cartCount,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};