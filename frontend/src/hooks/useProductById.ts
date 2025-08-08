import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getListing } from '../lib/web3';
import type { DisplayProduct } from './useProducts'; // Assuming DisplayProduct is exported

export const useProductById = (id: string | null) => {
    const [product, setProduct] = useState<DisplayProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProduct = useCallback(async () => {
        if (!id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setProduct(null);

        try {
            if (id.startsWith('db-')) {
                // Fetch from your off-chain database API
                const productId = id.substring(3);
                const response = await fetch(`http://localhost:5000/api/products/${productId}`);
                if (!response.ok) {
                    throw new Error(`Product not found in database.`);
                }
                const dbData = await response.json();
                const p = dbData.data;

                console.log('API data received in hook:', p); 

                // Normalize to DisplayProduct format
                setProduct({
                    id: `db-${p.id}`,
                    name: p.name,
                    price: parseFloat(p.price),
                    quantity: p.quantity, // Note: your schema uses `quantity`, not `stock_quantity`
                    seller: p.seller.username,
                    rating: p.product_reviews?.length > 0 ? p.product_reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / p.product_reviews.length : 0,
                    description: p.description,
                    category: p.category?.name || 'Uncategorized',
                    image: p.images?.[0]?.imageUrl || '',
                    inStock: p.quantity > 0,
                    isBlockchain: false,
                });

            } else if (id.startsWith('blockchain-')) {
                // Fetch from the on-chain smart contract
                const listingId = parseInt(id.substring(11), 10);
                const listing = await getListing(listingId);

                // Check for a valid listing (listingId is not 0)
                if (Number(listing[0]) === 0) {
                    throw new Error(`Listing #${listingId} not found on the blockchain.`);
                }

                // Normalize to DisplayProduct format
                const productData = {
                    listingId: Number(listing[0]), seller: listing[1], name: listing[2],
                    description: listing[3], category: listing[4], price: listing[5],
                    quantity: Number(listing[6]), imageUrl: listing[8]
                };

                setProduct({
                    id: `blockchain-${productData.listingId}`,
                    name: productData.name,
                    price: parseFloat(ethers.formatEther(productData.price)),
                    quantity: productData.quantity,
                    seller: `${productData.seller.slice(0, 6)}...${productData.seller.slice(-4)}`,
                    rating: 4.5, // Placeholder rating for blockchain items
                    description: productData.description,
                    category: productData.category,
                    image: productData.imageUrl || '',
                    inStock: productData.quantity > 0,
                    isBlockchain: true,
                    blockchainData: productData
                });
            } else {
                throw new Error('Invalid product ID format.');
            }
        } catch (err: any) {
            console.error(`Error fetching product ${id}:`, err);
            setError(err.message || 'Failed to load product data.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    return { product, loading, error, refetchProduct: fetchProduct };
};