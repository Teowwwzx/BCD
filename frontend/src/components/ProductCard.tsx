'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '../contexts/WalletContext';

interface Product {
  id: number | string;
  name: string;
  price: number | string;
  image?: string;
  seller: string;
  rating: number;
  description?: string;
  category?: string;
  inStock?: boolean;
  isBlockchain?: boolean;
  blockchainData?: any;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
  onViewDetails?: (productId: number) => void;
  className?: string;
  loading?: boolean;
  isBlockchain?: boolean;
  requiresWallet?: boolean;
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onViewDetails, 
  className = '',
  loading = false,
  isBlockchain = false,
  requiresWallet = false
}: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isLoggedIn } = useWallet();
  const router = useRouter();

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      alert('Please log in to add items to your cart');
      router.push('/auth');
      return;
    }
    
    if (!onAddToCart) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      onAddToCart();
      console.log(`Added ${product.name} to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn) {
      alert('Please log in to make a purchase');
      router.push('/auth');
      return;
    }
    
    // Add to cart first, then redirect to checkout
    try {
      await handleAddToCart();
      // Redirect to cart page for immediate checkout
      router.push('/cart');
    } catch (error) {
      console.error('Error during buy now:', error);
      alert('Failed to process buy now request');
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(Number(product.id));
    } else {
      // Default navigation to product details page
      router.push(`/products/${product.id}`);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-sm ${
          index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
        }`}
      >
        ★
      </span>
    ));
  };

  const formatPrice = (price: number | string) => {
    if (typeof price === 'number') {
      return isBlockchain ? `${price.toFixed(4)} ETH` : `$${price.toFixed(2)}`;
    }
    return price;
  };

  const getButtonText = () => {
    if (!product.inStock) return 'Out of Stock';
    if (requiresWallet) return 'Connect Wallet';
    if (loading || isLoading) return 'Processing...';
    if (isBlockchain) return 'Purchase with ETH';
    return 'Add to Cart';
  };

  const getButtonStyle = () => {
    if (!product.inStock) {
      return 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed';
    }
    if (requiresWallet) {
      return 'bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800';
    }
    if (isBlockchain) {
      return 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800';
    }
    return 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Product Image */}
      <div 
        className="aspect-square bg-gray-200 flex items-center justify-center cursor-pointer relative group"
        onClick={handleViewDetails}
      >
        {product.image && !imageError ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">No Image</span>
          </div>
        )}
        
        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            className="bg-white text-gray-900 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 font-medium"
          >
            Quick View
          </button>
        </div>

        {/* Status badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {product.inStock === false && (
            <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
              Out of Stock
            </div>
          )}
          {isBlockchain && (
            <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium">
              Blockchain
            </div>
          )}
        </div>

        {/* Category Badge */}
        {product.category && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
            {product.category}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 transition-colors line-clamp-2 flex-1 mr-2">
              {product.name}
            </h3>
          </Link>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
            {formatPrice(product.price)}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          by <span className="font-medium">{product.seller}</span>
        </p>
        
        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex mr-2">
            {renderStars(product.rating)}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">({product.rating})</span>
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        
        {/* Actions */}
        <div className="flex flex-col space-y-3">
          
          <div className="flex justify-between items-center">
            <button
              onClick={handleViewDetails}
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="View Details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || loading || isLoading}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 disabled:cursor-not-allowed ${getButtonStyle()}`}
            >
              {(loading || isLoading) && (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              )}
              {getButtonText()}
            </button>
          </div>
          
          <button 
            onClick={handleBuyNow}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-colors font-medium"
          >
            Buy Now
          </button>
        </div>
        
        {/* Additional blockchain info */}
        {isBlockchain && product.blockchainData && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Quantity: {product.blockchainData.quantity}</span>
              <span>Location: {product.blockchainData.location}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}