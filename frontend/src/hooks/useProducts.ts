// frontend/src/hooks/useProducts.ts

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getTotalListings, getListing } from '../lib/web3';
import type { Product as DbProduct, Review, PaginationMeta, ProductsParams } from '../types'; // Rename for clarity

// Use the environment variable for the API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// =================================================================
// UI-LEVEL "VIEW MODEL"
// =================================================================

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
// HELPER FUNCTION TO CALCULATE RATING FROM REVIEWS
// =================================================================

// Calculate average rating from product reviews array
const calculateAverageRating = (reviews: Review[]): number => {
    if (!reviews || reviews.length === 0) {
        return 0;
    }
    
    const totalRating = reviews.reduce((sum: number, review: Review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    return Math.round(averageRating * 10) / 10; // e.g., 4.3
};

// =================================================================
// THE HOOK
// =================================================================

/**
 * A custom hook to fetch and manage all product data from both
 * the database (off-chain) and the blockchain (on-chain).
 * It returns a unified list of products for display with pagination support.
 */
export const useProducts = (params: ProductsParams = {}) => {
    const [allProducts, setAllProducts] = useState<DisplayProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);

    const fetchProducts = useCallback(async (fetchParams: ProductsParams = {}) => {
        const {
            page = 1,
            limit = 20,
            category,
            search,
            sortBy = 'createdAt-desc',
            sellerId
        } = { ...params, ...fetchParams };
        setLoading(true);
        setError(null);

        try {
            // --- 1. Fetch from Database (Off-Chain) ---
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                sortBy
            });
            
            if (category && category !== 'all') queryParams.append('category', category);
            if (search) queryParams.append('search', search);
            if (sellerId) queryParams.append('sellerId', sellerId.toString());
            
            const dbResponse = await fetch(`${API_BASE_URL}/products?${queryParams}`);
            if (!dbResponse.ok) throw new Error('Failed to fetch database products.');
            const dbResult = await dbResponse.json();
            
            // Set pagination metadata from API response
            setPagination(dbResult.pagination);

            // Process database products with ratings from included reviews
            const databaseProducts: DisplayProduct[] = (dbResult.data || []).map((p: DbProduct): DisplayProduct => {
                // Calculate rating from included reviews
                const rating = calculateAverageRating(p.product_reviews || []);

                return {
                    id: `db-${p.id}`,
                    name: p.name,
                    description: p.description || '',
                    price: Number(p.price),
                    quantity: p.quantity,
                    seller: p.seller.username,
                    rating: rating,
                    category: p.category?.name || 'Uncategorized',
                    image: p.images?.[0]?.imageUrl || '/placeholder.png',
                    inStock: p.quantity > 0, // Also update this line
                    isBlockchain: p.isDigital,
                };
            });

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
            // Note: For pagination, we only show database products on paginated requests
            // Blockchain products are only added when fetching the first page without filters
            if (page === 1 && !search && !category && !sellerId) {
                setAllProducts([...databaseProducts, ...blockchainProducts]);
            } else {
                setAllProducts(databaseProducts);
            }

        } catch (err: any) {
            console.error('Error in useProducts hook:', err);
            setError(err.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    }, [params.page, params.limit, params.category, params.search, params.sortBy, params.sellerId]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return { 
        allProducts, 
        loading, 
        error, 
        pagination,
        refetchProducts: fetchProducts,
        fetchProducts: (newParams: ProductsParams) => fetchProducts(newParams)
    };
};
