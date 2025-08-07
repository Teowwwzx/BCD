import { useState, useEffect, useCallback } from 'react';
import { getTotalListings, getListing, formatEther } from '../lib/web3';

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
        setError(null);
        try {
            // Fetch from your off-chain database API
            const dbResponse = await fetch('http://localhost:5000/api/products');
            if (!dbResponse.ok) throw new Error(`API fetch error! status: ${dbResponse.status}`);
            const dbData = await dbResponse.json();

            const databaseProducts = (dbData.data || []).map((p: any): DisplayProduct => ({
                id: `db-${p.id}`,
                name: p.name,
                price: parseFloat(p.price),
                quantity: p.stock_quantity,
                seller: p.seller.username,
                rating: p.rating || 0,
                description: p.description,
                category: p.category?.name || 'Uncategorized',
                image: p.images?.[0]?.imageUrl || 'https://res.cloudinary.com/demo/image/upload/v1629892837/sample.jpg',
                inStock: p.stock_quantity > 0,
                isBlockchain: false,
            }));

            // Fetch from the on-chain smart contract
            const totalListings = Number(await getTotalListings());
            const blockchainProducts: DisplayProduct[] = [];
            for (let i = 1; i <= totalListings; i++) {
                try {
                    const listing = await getListing(i);
                    if (Number(listing[9]) === 0) { // Active status
                        const productData = {
                            listingId: Number(listing[0]), seller: listing[1], name: listing[2],
                            description: listing[3], category: listing[4], price: listing[5],
                            quantity: Number(listing[6]), imageUrl: listing[8]
                        };
                        blockchainProducts.push({
                            id: `blockchain-${productData.listingId}`,
                            name: productData.name,
                            price: parseFloat(formatEther(productData.price)),
                            quantity: productData.quantity,
                            seller: `${productData.seller.slice(0, 6)}...${productData.seller.slice(-4)}`,
                            rating: 4.5,
                            description: productData.description,
                            category: productData.category,
                            image: productData.imageUrl || 'https://res.cloudinary.com/demo/image/upload/v1629892837/sample.jpg',
                            inStock: productData.quantity > 0,
                            isBlockchain: true,
                            blockchainData: productData
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