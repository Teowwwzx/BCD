'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '../contexts/WalletContext';

interface Product {
  id: number;
  name: string;
  price: string;
  image?: string;
  seller: string;
  rating: number;
  description?: string;
  category?: string;
  inStock?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: number) => void;
  onViewDetails?: (productId: number) => void;
  className?: string;
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onViewDetails, 
  className = '' 
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
      onAddToCart(product.id);
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
      onViewDetails(product.id);
    } else {
      // Default navigation to product details page
      window.location.href = `/products/${product.id}`;
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <svg 
        key={i} 
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`} 
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${className}`}>
      {/* Product Image */}
      <div 
        className="aspect-square bg-gray-200 flex items-center justify-center cursor-pointer relative group"
        onClick={handleViewDetails}
      >
        {product.image && !imageError ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
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

        {/* Stock Status Badge */}
        {product.inStock === false && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
            Out of Stock
          </div>
        )}

        {/* Category Badge */}
        {product.category && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
            {product.category}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 
          className="font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
          onClick={handleViewDetails}
        >
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 mb-2">
          by <span className="font-medium">{product.seller}</span>
        </p>
        
        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex">
            {renderStars(product.rating)}
          </div>
          <span className="text-sm text-gray-600 ml-2">({product.rating})</span>
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        
        {/* Price and Actions */}
        <div className="flex flex-col space-y-3">
          <span className="text-lg font-bold text-blue-600">
            {product.price}
          </span>
          
          <div className="flex space-x-2">
            <button
              onClick={handleViewDetails}
              className="text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              title="View Details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            
            <button
              onClick={handleAddToCart}
              disabled={isLoading || product.inStock === false}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                product.inStock === false
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isLoading
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </div>
              ) : product.inStock === false ? (
                'Out of Stock'
              ) : (
                'Add to Cart'
              )}
            </button>
          </div>
          
          <button 
            onClick={handleBuyNow}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}