// frontend/src/components/ProductDetailClient.tsx

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useProduct } from '../hooks/useProduct';
import { useCart } from '../contexts/CartContext';      // THE FIX: Import the hook
import { useAuth } from '../contexts/AuthContext';

export default function ProductDetailClient({ id }: { id: string }) {
    console.log('CLIENT COMPONENT (ProductDetailClient.tsx): Received prop id:', id);

    const { product, loading, error } = useProduct(id);
    const [quantity, setQuantity] = useState(1);

    // --- THE FIX ---
    // Call our custom hook directly. It's cleaner and safer.
    const { addToCart, loading: cartLoading } = useCart();
    const { isLoggedIn, user } = useAuth();

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
                    />
                </div>
                <div>
                    <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
                    <p className="text-gray-400 mb-4">Sold by: {sellerName}</p>
                    <p className="text-2xl text-cyan-400 mb-6">${product.price.toFixed(2)}</p>
                    <p className="mb-6">{product.description}</p>

                    <div className="flex items-center gap-4 mb-6">
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
                            className="w-20 p-2 bg-gray-800 border border-gray-600 rounded"
                            min="1"
                        />
                        <button
                            onClick={handleAddToCart}
                            disabled={cartLoading || product.isBlockchain}
                            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2 px-6 rounded disabled:opacity-50"
                        >
                            {cartLoading ? 'Adding...' : 'Add to Cart'}
                        </button>
                    </div>

                    {product.isBlockchain && (
                        <div className="border-t border-gray-700 pt-6 mt-6">
                            <h2 className="text-2xl font-bold text-purple-400 mb-4">On-Chain Asset</h2>
                            {/* Blockchain-specific purchase logic would go here */}
                            <button className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-6 rounded">
                                Purchase with Wallet
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}