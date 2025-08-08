'use client';

import React, { useState, useMemo } from 'react';
import { useProducts, DisplayProduct } from '../../hooks/useProducts';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';

// This is now a simple page that reuses all our hard work from the hook!
export default function ProductsPage() {
  const { allProducts, loading, error } = useProducts();
  
  // You can add filtering and sorting state here if you want this
  // page to have different filters than the homepage.
  const [searchTerm, setSearchTerm] = useState('');

  // The filtering logic is the same as the homepage
  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allProducts, searchTerm]);

  return (
    <div className="min-h-screen bg-[#0d0221] text-[#00f5c3] font-mono-pixel">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <h1 className="font-pixel text-4xl text-white mb-8">// ALL_PRODUCTS</h1>
        
        {/* Add search/filter controls here as needed */}
        <input
          type="text"
          placeholder="SEARCH_QUERY..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 bg-black border-2 border-[#30214f] text-[#00f5c3] focus:border-[#00f5c3] focus:outline-none mb-8"
        />

        {loading && <p className="text-center font-pixel animate-pulse">LOADING_PRODUCTS...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}