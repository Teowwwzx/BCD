import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth'; //_ 1. Import useAuth for security
import type { Product } from '../types/index';
import { ProductStatus } from '../types/index';

export const useAdminProducts = () => {
  const { token, user } = useAuth(); //_ 3. Get the token from context
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchProducts = useCallback(async () => {
    if (user?.user_role !== 'admin') {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
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
  }, [token, API_BASE_URL, user?.user_role]);

  const updateProductStatus = useCallback(async (productId: number, status: ProductStatus) => {
    if (user?.user_role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }
    
    setActionLoading(productId);
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) throw new Error('Failed to update product status');
      
      const result = await response.json();
      if (result.success) {
        // Update the local state
        setProducts(prev => prev.map(product => 
          product.id === productId ? { ...product, status } : product
        ));
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setActionLoading(null);
    }
  }, [token, API_BASE_URL, user?.user_role]);

  const suspendProduct = useCallback(async (productId: number) => {
    return updateProductStatus(productId, ProductStatus.Archived);
  }, [updateProductStatus]);

  const publishProduct = useCallback(async (productId: number) => {
    return updateProductStatus(productId, ProductStatus.Published);
  }, [updateProductStatus]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { 
    products, 
    loading, 
    error, 
    actionLoading,
    refetch: fetchProducts,
    updateProductStatus,
    suspendProduct,
    publishProduct
  };
};