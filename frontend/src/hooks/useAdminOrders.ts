import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Order } from '../types/index';

export const useAdminOrders = () => {
  const { token } = useAuth(); //_ 3. Get the token from context
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchOrders = useCallback(async () => {
    if (!token) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
          headers: { 'Authorization': `Bearer ${token}` } //_ 4. Send auth token
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const result = await response.json();
      //_ 5. Handle the standard API response shape
      if (result.success) {
        setOrders(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
};