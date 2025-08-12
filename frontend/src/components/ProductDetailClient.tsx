// frontend/src/components/ProductDetailClient.tsx

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useProduct } from '../hooks/useProduct';
import { useCart } from '../contexts/CartContext';      // THE FIX: Import the hook
import { useAuth } from '../contexts/AuthContext';
import { purchaseProduct, parseEther } from '../lib/web3';

export default function ProductDetailClient({ id }: { id: string }) {
    console.log('CLIENT COMPONENT (ProductDetailClient.tsx): Received prop id:', id);

    const { product, loading, error } = useProduct(id);
    const [quantity, setQuantity] = useState(1);

    // --- THE FIX ---
    // Call our custom hook directly. It's cleaner and safer.
    const { addToCart, loading: cartLoading } = useCart();
    const { isLoggedIn, isWalletConnected, connectWallet } = useAuth();

    const handleAddToCart = async () => {
        if (!isLoggedIn) {
            alert("Please log in to add items to your cart.");
            return;
        }
        if (product && !product.isBlockchain) {
            // The product ID from the hook is the raw database ID
            await addToCart(product.id, quantity);
            alert(`${product.name} added to cart!`);
        }
    };

    const handlePurchaseWithWallet = async () => {
        if (!product || !product.isBlockchain) return;
        try {
            if (!isWalletConnected) {
                await connectWallet();
            }
            const listingId = product.id; // useProduct maps blockchain id to numeric listingId
            const totalPrice = Number(product.price) * quantity;
            const totalPriceEth = parseEther(totalPrice.toString());

            const receipt = await purchaseProduct(listingId, quantity, { value: totalPriceEth });
            alert(`Purchase successful! TX: ${receipt?.transactionHash || 'See wallet'}`);
        } catch (err: any) {
            console.error('Blockchain purchase error:', err);
            alert(err?.message || 'Blockchain purchase failed');
        }
    };

    if (loading) return <div>Loading Product...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!product) return <div>Product not found.</div>;

    const imageUrl = product.images?.[0]?.imageUrl || '/placeholder.png';
    const sellerName = product.seller?.username || 'Unknown Seller';

    return (
        <div className="container mx-auto p-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <Image
                        src={imageUrl}
                        alt={product.name}
                        width={500}
                        height={500}
                        className="rounded-lg"
                        unoptimized // Useful for external URLs that aren't configured in next.config.js
                    />
                </div>
                <div>
                    <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
                    <p className="text-gray-400 mb-4">Sold by: {sellerName}</p>
                    <p className="text-2xl text-cyan-400 mb-6">{product.isBlockchain ? `${product.price} ETH` : `$${product.price.toFixed(2)}`}</p>
                    <p className="mb-6">{product.description}</p>

                    <div className="flex items-center gap-4 mb-6">
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
                            className="w-20 p-2 bg-gray-800 border border-gray-600 rounded"
                            min="1"
                        />
                        {!product.isBlockchain && (
                            <button
                                onClick={handleAddToCart}
                                disabled={cartLoading}
                                className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2 px-6 rounded disabled:opacity-50"
                            >
                                {cartLoading ? 'Adding...' : 'Add to Cart'}
                            </button>
                        )}
                        {product.isBlockchain && (
                            <button
                                onClick={handlePurchaseWithWallet}
                                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-6 rounded"
                            >
                                Purchase with Wallet
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}