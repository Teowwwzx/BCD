// frontend/src/hooks/useProducts.ts

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getTotalListings, getListing } from '../lib/web3';
import type { Product as DbProduct } from '../types'; // Rename for clarity

// Use the environment variable for the API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// =================================================================
// UI-LEVEL "VIEW MODEL"
// =================================================================

interface ProductReview {
    id: string;
    productId: string;
    rating: number;
}

// This is the unified shape our components will use.
// It abstracts away the difference between a DB product and a blockchain listing.
export interface DisplayProduct {
    id: string; // Unified ID, e.g., "db-1" or "blockchain-1"
    name: string;
    price: number;
    quantity: number;
    seller: string;
    rating: number; // Can be a real or placeholder value
    description: string;
    category: string;
    image: string;
    inStock: boolean;
    isBlockchain: boolean;
    blockchainData?: any; // Store the raw blockchain data if needed
}

// =================================================================
// HELPER FUNCTION TO FETCH AND CALCULATE RATING
// =================================================================

// The productId type has been changed to string to match the `p.id` property.
const fetchProductRating = async (productId: string): Promise<number> => {
    try {
        // Use the API_BASE_URL constant and a more descriptive endpoint
        const res = await fetch(`${API_BASE_URL}/products/${productId}/reviews`);
        const json = await res.json();

        // Check if the request was successful and if there is review data
        if (!res.ok || !json.data || json.data.reviews.length === 0) {
            console.warn(`No reviews found for product ID ${productId}.`);
            return 0;
        }

        const reviews = json.data.reviews;
        const totalRating = reviews.reduce((sum: number, r: ProductReview) => sum + r.rating, 0);
        const averageRating = totalRating / reviews.length;

        return Math.round(averageRating * 10) / 10; // e.g., 4.3
    } catch (err) {
        console.error('Error fetching rating:', err);
        return 0;
    }
};

// =================================================================
// THE HOOK
// =================================================================

/**
 * A custom hook to fetch and manage all product data from both
 * the database (off-chain) and the blockchain (on-chain).
 * It returns a single, unified list of products for display.
 */
export const useProducts = () => {
    const [allProducts, setAllProducts] = useState<DisplayProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // --- 1. Fetch from Database (Off-Chain) ---
            const dbResponse = await fetch(`${API_BASE_URL}/products`);
            if (!dbResponse.ok) throw new Error('Failed to fetch database products.');
            const dbResult = await dbResponse.json();

            // To improve performance, we fetch all ratings concurrently
            const databaseProducts: DisplayProduct[] = await Promise.all(
                (dbResult.data || []).map(async (p: DbProduct): Promise<DisplayProduct> => {
                    // Fetch the rating for the current product
                    const rating = await fetchProductRating(p.id);

                    return {
                        id: `db-${p.id}`,
                        name: p.name,
                        description: p.description || '',
                        price: Number(p.price),
                        quantity: p.stock_quantity,
                        seller: p.seller.username,
                        rating: rating, // Use the calculated rating
                        category: p.category?.name || 'Uncategorized',
                        image: p.images?.[0]?.imageUrl || '/placeholder.png',
                        inStock: p.stock_quantity > 0,
                        isBlockchain: false,
                    };
                })
            );

            // --- 2. Fetch from Blockchain (On-Chain) ---
            let blockchainProducts: DisplayProduct[] = [];

            try {
                const totalListings = Number(await getTotalListings());

                for (let i = 1; i <= totalListings; i++) {
                    try {
                        const listing = await getListing(i);
                        if (listing.status === 0) { // Enum: ListingStatus.Active
                            blockchainProducts.push({
                                id: `blockchain-${listing.listingId}`,
                                name: listing.name,
                                price: parseFloat(ethers.formatEther(listing.price)),
                                quantity: Number(listing.quantity),
                                seller: `${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}`,
                                rating: 4.8,
                                description: listing.description,
                                category: listing.category,
                                image: listing.imageUrl || '/placeholder.png',
                                inStock: Number(listing.quantity) > 0,
                                isBlockchain: true,
                                blockchainData: listing,
                            });
                        }
                    } catch (listingError) {
                        console.warn(`Failed to fetch blockchain listing ${i}:`, listingError);
                        // Continue with other listings
                    }
                }
            } catch (blockchainError) {
                console.warn('Failed to fetch blockchain products:', blockchainError);
                // Continue with database products only
            }

            // --- 3. Combine and Set Final State ---
            setAllProducts([...databaseProducts, ...blockchainProducts]);

        } catch (err: any) {
            console.error('Error in useProducts hook:', err);
            setError(err.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return { allProducts, loading, error, refetchProducts: fetchProducts };
};
