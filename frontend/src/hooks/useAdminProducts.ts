import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext'; //_ 1. Import useAuth for security
import type { Product } from '../types/index';

export const useAdminProducts = () => {
  const { token, user } = useAuth(); //_ 3. Get the token from context
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchProducts = useCallback(async () => {
    if (user?.user_role !== 'admin') {
        setLoading(false);
        return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
          headers: { 'Authorization': `Bearer ${token}` } //_ 4. Send auth token
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const result = await response.json();
      //_ 5. Handle the standard API response shape
      if (result.success) {
        setProducts(result.data);
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
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
};