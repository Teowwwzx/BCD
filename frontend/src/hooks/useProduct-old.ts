import { useState, useEffect, useCallback } from 'react';// Assuming DisplayProduct is exported
import type { Product } from '../types'; // Import the Product type


/**
 * A custom hook to fetch a single product by its ID.
 * @param {string | number | null} productId - The ID of the product to fetch.
 * @returns The product data, loading state, error state, and a refetch function.
 */
export const useProduct = (productId: string | number | null) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    const fetchProduct = useCallback(async () => {
        // Only fetch if we have a valid productId
        if (!productId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
            if (!response.ok) {
                throw new Error('Product not found or failed to fetch.');
            }

            const result = await response.json();
            if (result.success) {
                setProduct(result.data);
            } else {
                throw new Error(result.error || 'An unknown API error occurred.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [productId, API_BASE_URL]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    return { product, loading, error, refetch: fetchProduct };
};