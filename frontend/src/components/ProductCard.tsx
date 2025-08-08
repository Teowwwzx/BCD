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

// This component now only needs the 'product' prop. It is much simpler.
export default function ProductCard({ product }: { product: DisplayProduct }) {
  const imageSrc = product.image || '/placeholder.png';

  return (
    <Link
      href={`/products/${product.id}`}
      className="block p-1 bg-gradient-to-br from-[#30214f] to-[#0d0221] hover:from-[#f0f] hover:to-[#0ff] group h-full"
    >
      <div className="bg-[#0d0221] p-4 h-full flex flex-col">
        <div className="relative w-full aspect-square bg-black mb-4">
          <Image
            key={imageSrc}
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex-grow flex flex-col">
          <h3 className="font-pixel text-lg text-white mb-2 truncate group-hover:text-[#00f5c3]">{product.name}</h3>
          <p className="text-sm text-gray-400 mb-2">SELLER :: {product.seller}</p>
          <div className="mb-4">
            <StarRating rating={product.rating} />
          </div>
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