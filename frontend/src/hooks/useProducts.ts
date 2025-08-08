import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getTotalListings, getListing } from '../lib/web3';

// Define the final, unified shape of a product for display
export interface DisplayProduct {
    id: string;
    name: string;
    price: number;
    quantity: number;
    seller: string;
    rating: number;
    description: string;
    category: string;
    image: string;
    inStock: boolean;
    isBlockchain: boolean;
    blockchainData?: any;
}

/**
 * A custom hook to fetch and manage all product data
 * from both the database and the blockchain.
 */
export const useProducts = () => {
    const [allProducts, setAllProducts] = useState<DisplayProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch from DB API
            const dbResponse = await fetch('http://localhost:5000/api/products');
            const dbData = await dbResponse.json();

            // THIS IS THE FIX: Transform raw data into DisplayProduct
            const databaseProducts = (dbData.data || []).map((p: any): DisplayProduct => ({
                id: `db-${p.id}`,
                name: p.name,
                description: p.description || '',
                price: parseFloat(p.price),
                quantity: p.quantity,
                seller: p.seller.username,
                rating: p.product_reviews?.length > 0 ? p.product_reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / p.product_reviews.length : 0,
                category: p.category?.name || 'Uncategorized',
                image: p.images?.[0]?.imageUrl || '', // Creates the 'image' property
                inStock: p.quantity > 0,
                isBlockchain: false, // Creates the 'isBlockchain' property
                blockchainData: undefined,
            }));

            // Fetch from the on-chain smart contract
            const totalListings = Number(await getTotalListings());
            
            const blockchainProducts: DisplayProduct[] = [];
            for (let i = 1; i <= totalListings; i++) {
                try {
                    const listing = await getListing(i);
                    if (listing.status === 0) { // ListingStatus.Active
                        blockchainProducts.push({
                            id: `blockchain-${listing.listingId}`,
                            name: listing.name,
                            price: parseFloat(ethers.formatEther(listing.price)),
                            quantity: Number(listing.quantity),
                            seller: `${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}`,
                            rating: 4.5, // Placeholder
                            description: listing.description,
                            category: listing.category,
                            image: listing.imageUrl || '',
                            inStock: Number(listing.quantity) > 0,
                            isBlockchain: true,
                            blockchainData: listing, // Pass the whole struct
                        });
                    }
                } catch (err) {
                    console.error(`Error loading blockchain listing ${i}:`, err);
                }
            }

            setAllProducts([...databaseProducts, ...blockchainProducts]);
        } catch (err: any) {
            console.error('Error in useProducts hook:', err);
            setError(err.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    }, []); // useCallback with an empty dependency array ensures this function is created only once

    // Run the fetch function once when the hook is first used
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Return the state and a function to refetch if needed
    return { allProducts, loading, error, refetchProducts: fetchProducts };
};