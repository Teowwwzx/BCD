// frontend/src/app/products/page.tsx

'use client';

import React, { useState, useMemo } from 'react';
// Correctly alias 'allProducts' to 'products' when destructuring
import { useProducts, DisplayProduct } from '../../hooks/useProducts'; 
import ProductCard from '../../components/ProductCard';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // --- THE FIX ---
  // We get 'allProducts' from the hook and rename it to 'products' for use in this component.
  const { allProducts: products, loading, error } = useProducts();

  // This useMemo hook will now receive a defined 'products' array
  const categories = useMemo(() => {
    // We add a defensive check here to be safe
    if (!products || products.length === 0) return [{ label: 'All Categories', value: 'all' }];
    
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
    return [
      { label: 'All Categories', value: 'all' },
      ...uniqueCategories.map(c => ({ label: c, value: c }))
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return []; // Defensive check
    
    return products
      .filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.seller.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-low': return a.price - b.price;
          case 'price-high': return b.price - a.price;
          case 'rating': return b.rating - a.rating;
          default: return a.name.localeCompare(b.name);
        }
      });
  }, [products, searchTerm, selectedCategory, sortBy]);

  if (loading) {
      return <div>Loading products...</div>;
  }

  if (error) {
      return <div>Error loading products: {error}</div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">All Products</h1>
        {/* Filtering and sorting UI would go here */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product as DisplayProduct} />
            ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}