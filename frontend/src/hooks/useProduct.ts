// frontend/src/hooks/useProduct.ts

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '../types'; // Import our main Product type

// Use the environment variable for the API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * A custom hook to fetch a single product by its prefixed ID (e.g., "db-1").
 * It handles stripping the prefix before making the API call.
 */
export const useProduct = (id: string | null) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProduct = useCallback(async () => {
        console.log('HOOK (useProduct.ts): Hook called with id:', id);

        if (!id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log(`HOOK (useProduct.ts): Received id: "${id}"`);

            if (id.startsWith('db-')) {
                // --- THIS IS THE FIX ---
                // 1. Get the full prefixed ID (e.g., "db-1")
                // 2. Strip the prefix to get the clean numeric ID for the API call.
                const numericId = id.substring(3);
                console.log(`HOOK (useProduct.ts): Stripped prefix. Making API call with numericId: "${numericId}"`);

                // 3. Make the API call with ONLY the numeric ID.
                const response = await fetch(`${API_BASE_URL}/products/${numericId}`);
                console.log(`HOOK (useProduct.ts): API call response status: ${response.status}`);

                if (!response.ok) {
                    throw new Error(`API Error: Product not found or failed to fetch.`);
                }

                const result = await response.json();

                if (result.success && result.data) {
                    // 4. Ensure price is a number before setting state.
                    const fetchedProduct = {
                        ...result.data,
                        price: Number(result.data.price)
                    };
                    setProduct(fetchedProduct);
                } else {
                    throw new Error(result.error || 'Failed to parse product data.');
                }
            } else if (id.startsWith('blockchain-')) {
                // This is where you would add logic to fetch an on-chain listing by its ID
                setError("On-chain product detail fetching is not yet implemented.");
            } else {
                throw new Error("Invalid product ID format provided.");
            }

        } catch (err: any) {
            console.error('useProduct Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]); // Dependency array ensures this runs only when the id prop changes

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    return { product, loading, error, refetch: fetchProduct };
};