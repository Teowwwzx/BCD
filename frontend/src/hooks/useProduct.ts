// frontend/src/hooks/useProduct.ts

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getListing } from '../lib/web3';
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
                    // 4. Ensure price is a number and map to Product type
                    const fetchedProduct: Product = {
                        ...result.data,
                        price: Number(result.data.price),
                        stock_quantity: result.data.quantity || result.data.stock_quantity || 0
                    };
                    setProduct(fetchedProduct);
                } else {
                    throw new Error(result.error || 'Failed to parse product data.');
                }
            } else if (id.startsWith('blockchain-')) {
                // Handle blockchain product fetching
                const blockchainId = id.substring(10); // Remove 'blockchain-' prefix
                console.log(`HOOK (useProduct.ts): Fetching blockchain product with ID: "${blockchainId}"`);
                
                try {
                    const listing = await getListing(Number(blockchainId));
                    
                    if (listing.status === 0) { // Enum: ListingStatus.Active
                        // Convert blockchain listing to Product format
                        const blockchainProduct: Product = {
                            id: Number(blockchainId),
                            sellerId: 0, // Placeholder for blockchain products
                            categoryId: null,
                            name: listing.name,
                            description: listing.description,
                            short_desc: null,
                            sku: null,
                            price: parseFloat(ethers.formatEther(listing.price)),
                            stock_quantity: Number(listing.quantity),
                            min_order_quant: null,
                            max_order_quant: null,
                            status: 'published' as any,
                            isDigital: false,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            seller: {
                                username: `${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}`
                            },
                            category: {
                                name: listing.category
                            },
                            images: listing.imageUrl ? [{
                                id: 1,
                                imageUrl: listing.imageUrl,
                                altText: listing.name,
                                sortOrder: 1
                            }] : [],
                            product_reviews: []
                        };
                        
                        setProduct(blockchainProduct);
                    } else {
                        throw new Error('Blockchain product is not active or not found.');
                    }
                } catch (blockchainError: any) {
                    console.error('Failed to fetch blockchain product:', blockchainError);
                    throw new Error(`Failed to fetch blockchain product: ${blockchainError.message}`);
                }
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