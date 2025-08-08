'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ethers } from 'ethers';
import { useProductById } from '../hooks/useProductById';
import { useWallet } from '../contexts/WalletContext';
import { useCart } from '../contexts/CartContext';
import { purchaseProduct } from '../lib/web3';

// This is the interactive client component for the product detail page.
// It receives the product `id` as a simple string prop from its parent Server Component.
export default function ProductDetailClient({ id }: { id: string }) {
    // 1. Fetch all necessary data and functions from our custom hooks.
    const { product, loading, error, refetchProduct } = useProductById(id);
    const { walletAddress } = useWallet();
    const { addToCart, loading: cartLoading } = useCart();
    console.log('Product data in component:', product);

    // 2. Define the logic for the purchase button.
    const handlePurchase = async () => {
        if (!product) return;

        // Handle blockchain purchases
        if (product.isBlockchain) {
            if (!walletAddress || !product.blockchainData) {
                alert('Please connect your wallet to purchase blockchain items.');
                return;
            }
            try {
                const priceInWei = ethers.parseEther(product.price.toString());
                await purchaseProduct(product.blockchainData.listingId, 1, { value: priceInWei });
                alert('Purchase successful! Transaction sent.');
                refetchProduct(); // Refetch data to show updated stock
            } catch (err: any) {
                const message = err.reason || err.message || "An unknown error occurred.";
                alert(`Purchase failed: ${message}`);
            }
            // Handle database (off-chain) cart additions
        } else {
            try {
                const productId = parseInt(product.id.replace('db-', ''));
                await addToCart(productId, 1);
                alert(`${product.name} added to cart!`);
            } catch (err) {
                alert('Failed to add item to cart.');
            }
        }
    };

    // 3. Main render function to handle loading, error, and success states.
    const renderContent = () => {
        // State: Loading
        if (loading) {
            return <div className="text-center py-20 font-pixel text-lg animate-pulse">LOADING_PRODUCT_DATA...</div>;
        }

        // State: Error
        if (error || !product) {
            return (
                <div className="text-center py-20 border-2 border-red-500 p-4">
                    <h3 className="text-lg font-pixel text-red-500 mb-2">[DATA_CORRUPTION]</h3>
                    <p className="text-red-400 mb-4">{error || 'Could not load product.'}</p>
                    <Link href="/" className="font-pixel text-sm bg-red-500 text-white px-4 py-2 hover:bg-red-400">[RETURN_TO_MARKET]</Link>
                </div>
            );
        }

        // State: Success - Render the full page layout
        return (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Left Column: Image */}
                <div className="md:col-span-2">
                    <div className="p-1 bg-gradient-to-br from-[#f0f] to-[#0ff]">
                        <div className="bg-black aspect-square w-full relative">
                            <Image
                                src={product.image || '/placeholder.png'}
                                alt={product.name}
                                fill
                                className="object-cover"
                                unoptimized // Add this if you have issues with external non-configured image URLs
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="md:col-span-3">
                    <h1 className="font-pixel text-3xl md:text-4xl text-white mb-4">{product.name}</h1>

                    <div className="flex items-center space-x-4 mb-6">
                        <span className="px-3 py-1 bg-cyan-500 text-black text-sm font-bold">{product.category}</span>
                        {product.isBlockchain && <span className="px-3 py-1 bg-purple-500 text-white text-sm font-bold">ON-CHAIN</span>}
                    </div>

                    <p className="text-lg text-gray-300 mb-8 leading-relaxed">{product.description}</p>

                    <div className="border-y-2 border-dashed border-[#30214f] py-4 mb-8 space-y-2">
                        <p className="text-xl">SELLER :: <span className="text-white">{product.seller}</span></p>
                        <p className="text-xl">STOCK :: <span className="text-white">{product.inStock ? product.quantity : 'OUT_OF_STOCK'}</span></p>
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="font-pixel text-4xl text-[#00f5c3]">${product.price.toFixed(2)}</p>
                        <button
                            onClick={handlePurchase}
                            disabled={!product.inStock || cartLoading}
                            className="bg-[#00f5c3] text-black px-8 py-4 font-pixel text-md hover:bg-white disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {product.isBlockchain ? '[ BUY_NOW ]' : '[ ADD_TO_CART ]'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="container mx-auto px-4 py-16">
            <div className="mb-8">
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">&lt;&lt; RETURN_TO_MARKET</Link>
            </div>
            {renderContent()}
        </main>
    );
}