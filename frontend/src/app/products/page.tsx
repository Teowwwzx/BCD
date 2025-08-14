// frontend/src/app/products/page.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
// Correctly alias 'allProducts' to 'products' when destructuring
import { useProducts, DisplayProduct } from '../../hooks/useProducts'; 
import { useCart } from '../../contexts/CartContext';
import ProductCard from '../../components/ProductCard';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const router = useRouter();

  // --- THE FIX ---
  // We get 'allProducts' from the hook and rename it to 'products' for use in this component.
  const { allProducts: products, loading, error } = useProducts();
  const { addToCart, loading: cartLoading } = useCart();

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

  const handleAddToCart = async (product: DisplayProduct) => {
    if (product.isBlockchain) {
      alert("On-chain assets must be purchased directly from their detail page.");
      router.push(`/products/${product.id}`);
      return;
    }
    try {
      const dbId = parseInt(product.id.replace('db-', ''));
      await addToCart(dbId, 1);
      alert(`${product.name} added to cart!`);
    } catch (err) {
      console.error('Add to cart error:', err);
      alert('Failed to add item to cart.');
    }
  };

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
                <ProductCard 
                  key={product.id} 
                  product={product as DisplayProduct} 
                  onAddToCart={() => handleAddToCart(product)}
                  cartLoading={cartLoading}
                />
            ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}