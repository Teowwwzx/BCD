// frontend/src/components/ProductCard.tsx

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { DisplayProduct } from '../hooks/useProducts'; // Use our unified DisplayProduct type

// A simple component to render stars
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

// This component now only needs the 'product' prop, which is of type DisplayProduct.
// It is much simpler and more robust.
export default function ProductCard({ product }: { product: DisplayProduct }) {
  const imageSrc = product.image || '/placeholder.png';

  return (
    <Link
      href={`/products/${product.id}`} // The unified ID works for both DB and blockchain products
      className="block p-1 bg-gradient-to-br from-[#30214f] to-[#0d0221] hover:from-[#f0f] hover:to-[#0ff] group h-full"
    >
      <div className="bg-[#0d0221] p-4 h-full flex flex-col">
        <div className="relative w-full aspect-square bg-black mb-4">
          <Image
            key={imageSrc} // Using a key helps React re-render the image if the src changes
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized // Useful for external URLs that aren't configured in next.config.js
          />
          <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
            <span className="px-2 py-1 bg-cyan-500 text-black text-xs font-bold">{product.category}</span>
            {!product.inStock && <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold">OUT_OF_STOCK</span>}
            {product.isBlockchain && <span className="px-2 py-1 bg-purple-500 text-white text-xs font-bold">ON-CHAIN</span>}
          </div>
        </div>
        <div className="flex-grow flex flex-col">
          <h3 className="font-pixel text-lg text-white mb-2 truncate group-hover:text-[#00f5c3]">{product.name}</h3>
          <p className="text-sm text-gray-400 mb-2 truncate">SELLER :: {product.seller}</p>
          <div className="mb-4">
            <StarRating rating={product.rating} />
          </div>
          <p className="text-xs text-gray-400 mb-4 flex-grow">{product.description ? `${product.description.substring(0, 100)}...` : ''}</p>
          <div className="mt-auto flex justify-between items-center pt-4 border-t-2 border-dashed border-[#30214f]">
            <p className="font-pixel text-2xl text-[#00f5c3]">${product.price.toFixed(2)}</p>
            <div className="font-pixel text-sm text-black bg-[#00f5c3] px-3 py-2 group-hover:bg-white">
              [ VIEW ]
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}