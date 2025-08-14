'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Order } from '../types';

interface UseOrdersReturn {
  orders: Order[];
  ordersIsLoading: boolean;
  ordersError: string | null;
  refetchOrders: () => Promise<void>;
}

export const useOrders = (userId: number | null): UseOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersIsLoading, setOrdersIsLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchOrders = useCallback(async (): Promise<void> => {
    if (!userId) {
      setOrdersIsLoading(false);
      return;
    }

    setOrdersIsLoading(true);
    setOrdersError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/orders?buyer_id=${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch orders`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch orders');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setOrdersError(errorMessage);
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersIsLoading(false);
    }
  }, [userId, API_BASE_URL]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    ordersIsLoading,
    ordersError,
    refetchOrders: fetchOrders
  };
};