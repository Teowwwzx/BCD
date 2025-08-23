// frontend/src/components/ProductDetailClient.tsx

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useProduct } from '../hooks/useProduct';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import { useToasts } from '../contexts/ToastContext';
import { useRouter } from 'next/navigation';
import { SuccessModal } from './Modal';
import type { Review } from '../types';


export default function ProductDetailClient({ id }: { id: string }) {
    const { product, loading, error } = useProduct(id);
    const [quantity, setQuantity] = useState(1);
    const { addToCart, loading: cartLoading } = useCart();
    const { isLoggedIn, user } = useAuth();
    const router = useRouter();
    const { addToast } = useToasts();
    const [showSuccessModal, setShowSuccessModal] = useState(false);


    const handleAddToCart = async () => {
        if (!isLoggedIn) {
            alert("Please log in to add items to your cart.");
            router.push('/auth');
            return;
        }

        if (product) {
            try {
                // We now pass the product's stock_quantity as the third argument.
                await addToCart(product.id, quantity, product.quantity);
                // Show success toast
                addToast(`Added ${quantity} ${product.name} to cart!`, 'success')
                // setShowSuccessModal(true);
            } catch (error) {
                console.error('Error adding to cart:', error);
                // Error handling is already done in the CartContext
            }
        }
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
    };

    const handleViewCart = () => {
        setShowSuccessModal(false);
        router.push('/cart');
    };

    if (loading) return <div>Loading Product...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!product) return <div>Product not found.</div>;

    const imageUrl = product.images?.[0]?.imageUrl || '/placeholder.png';
    const sellerName = product.seller?.username || 'Unknown Seller';

    // Calculate average rating
    const averageRating = product.product_reviews && product.product_reviews.length > 0
        ? product.product_reviews.reduce((sum, review) => sum + review.rating, 0) / product.product_reviews.length
        : 0;

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`text-xl ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-600'}`}>
                ★
            </span>
        ));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Product Details Section */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-2xl border border-gray-700">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Product Image */}
                        <div className="space-y-4">
                            <div className="relative overflow-hidden rounded-xl bg-gray-700">
                                <Image
                                    src={imageUrl}
                                    alt={product.name}
                                    width={600}
                                    height={600}
                                    className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                    {product.name}
                                </h1>
                                <div className="flex items-center gap-4 mb-4">
                                    <p className="text-gray-300 text-lg">Sold by: <span className="text-cyan-400 font-semibold">{sellerName}</span></p>
                                    {product.product_reviews && product.product_reviews.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex">{renderStars(averageRating)}</div>
                                            <span className="text-gray-400">({product.product_reviews.length} reviews)</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-6 border border-cyan-500/30">
                                <p className="text-3xl lg:text-4xl font-bold text-cyan-400 mb-2">
                                    ${product.price.toFixed(2)}
                                </p>
                                <p className="text-gray-300">
                                    Stock: <span className={`font-semibold ${product.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {product.quantity > 0 ? `${product.quantity} available` : 'Out of stock'}
                                    </span>
                                </p>
                            </div>

                            {product.description && (
                                <div className="bg-gray-700/50 rounded-xl p-6">
                                    <h3 className="text-xl font-semibold mb-3 text-gray-200">Description</h3>
                                    <p className="text-gray-300 leading-relaxed">{product.description}</p>
                                </div>
                            )}

                            {/* Add to Cart Section */}
                            <div className="bg-gray-700/50 rounded-xl p-6 space-y-4">
                                <div className="flex items-center gap-4 m-0">
                                        <label className="text-sm text-gray-400">Quantity</label>
                                    <div className="flex flex-col">
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
                                            className="w-24 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none transition-colors"
                                            min="1"
                                            max={product.quantity}
                                            disabled={product.quantity === 0}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={cartLoading || product.isDigital || product.quantity === 0}
                                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
                                        >
                                            {cartLoading ? 'Adding...' : product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Blockchain Section */}
                            {product.isDigital && (
                                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
                                    <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                                        <span>🔗</span> On-Chain Asset
                                    </h2>
                                    <p className="text-gray-300 mb-4">This is a digital asset stored on the blockchain.</p>
                                    <button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                                        Purchase with Wallet
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-white">Customer Reviews</h2>
                        {product.product_reviews && product.product_reviews.length > 0 && (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex">{renderStars(averageRating)}</div>
                                    <span className="text-2xl font-bold text-yellow-400">{averageRating.toFixed(1)}</span>
                                </div>
                                <span className="text-gray-400">({product.product_reviews.length} reviews)</span>
                            </div>
                        )}
                    </div>

                    {product.product_reviews && product.product_reviews.length > 0 ? (
                        <div className="space-y-6">
                            {product.product_reviews.map((review: Review) => (
                                <div key={review.id} className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                {review.user?.username?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-white">{review.user?.username || 'Anonymous'}</h4>
                                                <p className="text-gray-400 text-sm">{formatDate(review.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex">{renderStars(review.rating)}</div>
                                            <span className="text-yellow-400 font-semibold">{review.rating}/5</span>
                                        </div>
                                    </div>
                                    
                                    {review.title && (
                                        <h5 className="font-semibold text-lg text-white mb-2">{review.title}</h5>
                                    )}
                                    
                                    {review.review_text && (
                                        <p className="text-gray-300 leading-relaxed mb-3">{review.review_text}</p>
                                    )}
                                    
                                    {review.is_verified_purchase && (
                                        <div className="flex items-center gap-2">
                                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
                                                ✓ Verified Purchase
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📝</div>
                            <h3 className="text-xl font-semibold text-gray-300 mb-2">No reviews yet</h3>
                            <p className="text-gray-400">Be the first to review this product!</p>
                        </div>
                    )}
                </div>

                {/* Success Modal */}
                <SuccessModal
                    isOpen={showSuccessModal}
                    onClose={handleSuccessModalClose}
                    title="Added to Cart!"
                    message={`${product?.name} (${quantity} ${quantity === 1 ? 'item' : 'items'}) has been added to your cart.`}
                    actionText="View Cart"
                    onAction={handleViewCart}
                />
            </div>
        </div>
    );
}