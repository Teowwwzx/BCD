// frontend/src/components/ProductCard.tsx

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { DisplayProduct } from '../hooks/useProducts';

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const partialStar = rating % 1 > 0;
  const emptyStars = 5 - fullStars - (partialStar ? 1 : 0);
  return (
    <div className="flex items-center text-yellow-400">
      {'★'.repeat(fullStars)}
      {partialStar && '½'}
      {'☆'.repeat(emptyStars)}
      <span className="text-gray-400 text-xs ml-2">({rating.toFixed(1)})</span>
    </div>
  );
};

// --- 1. Define the props interface for the component ---
interface ProductCardProps {
  product: DisplayProduct;
  onAddToCart: (product: DisplayProduct) => void;
  cartLoading: boolean;
}

// --- 2. Update the function to accept the new props ---
export default function ProductCard({ product, onAddToCart, cartLoading }: ProductCardProps) {
  const imageSrc = product.image || '/placeholder.png';

  // --- 3. Create a click handler for the button ---
  // This stops the click from navigating via the parent <Link>
  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents the link from navigating
    e.stopPropagation(); // Stops the event from bubbling up
    onAddToCart(product);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden h-full transition-transform transform hover:-translate-y-1">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative w-full aspect-square bg-gray-200 dark:bg-gray-700">
          <Image
            key={imageSrc}
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
          />
          {product.isBlockchain && (
            <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded">
              ON-CHAIN
            </span>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">{product.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Seller: <span className="font-medium text-gray-700 dark:text-gray-300">{product.seller}</span>
        </p>
        <div className="mb-4">
          <StarRating rating={product.rating} />
        </div>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <p className="text-xl font-bold text-gray-900 dark:text-white">${product.price.toFixed(2)}</p>
          
          {/* --- 4. Add the button with disabled logic and the new handler --- */}
          {!product.isBlockchain ? (
            <button
              onClick={handleAddToCartClick}
              disabled={cartLoading || !product.inStock}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {cartLoading ? '...' : 'Add to Cart'}
            </button>
          ) : (
            <Link 
              href={`/products/${product.id}`}
              className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              View
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}