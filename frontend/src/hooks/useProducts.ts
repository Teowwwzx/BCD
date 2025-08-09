// frontend/src/hooks/useProducts.ts

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getTotalListings, getListing } from '../lib/web3';
import type { Product as DbProduct } from '../types'; // Rename for clarity

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
            const dbResponse = await fetch(`http://localhost:5000/api/products`);
            if (!dbResponse.ok) throw new Error('Failed to fetch database products.');
            const dbResult = await dbResponse.json();
            
            const databaseProducts: DisplayProduct[] = (dbResult.data || []).map((p: DbProduct): DisplayProduct => ({
                id: `db-${p.id}`,
                name: p.name,
                description: p.description || '',
                price: Number(p.price),
                quantity: p.quantity,
                seller: p.seller.username,
                // A real rating system would be more complex
                rating: 4.5, // Placeholder rating for now
                category: p.category?.name || 'Uncategorized',
                image: p.images?.[0]?.imageUrl || '/placeholder.png',
                inStock: p.quantity > 0,
                isBlockchain: false,
            }));

            // --- 2. Fetch from Blockchain (On-Chain) ---
            const totalListings = Number(await getTotalListings());
            const blockchainProducts: DisplayProduct[] = [];

            for (let i = 1; i <= totalListings; i++) {
                const listing = await getListing(i);
                if (listing.status === 0) { // Enum: ListingStatus.Active
                    blockchainProducts.push({
                        id: `blockchain-${listing.listingId}`,
                        name: listing.name,
                        price: parseFloat(ethers.formatEther(listing.price)),
                        quantity: Number(listing.quantity),
                        seller: `${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}`,
                        rating: 4.8, // Placeholder for blockchain items
                        description: listing.description,
                        category: listing.category,
                        image: listing.imageUrl || '/placeholder.png',
                        inStock: Number(listing.quantity) > 0,
                        isBlockchain: true,
                        blockchainData: listing, // Keep the raw data if needed
                    });
                }
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