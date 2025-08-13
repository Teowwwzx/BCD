// src/app/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// --- Core Principles In Action ---
// 1. Import order: React/Next -> Hooks -> Components -> Types
import { useAuth } from '../hooks/useAuth';
import { useProducts, DisplayProduct } from '../hooks/useProducts';
import { useCart } from '../contexts/CartContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

export default function Home() {
  // --- A. Consume Hooks ---
  const { user, isLoggedIn, authIsLoading } = useAuth();
  const { allProducts, loading: productsLoading, error: productsError } = useProducts();
  const { addToCart, loading: cartLoading } = useCart();
  const router = useRouter();

  // --- B. Manage UI-Specific State ---
  const [showBlockchainProducts, setShowBlockchainProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // --- C. Guard Clause for Page Protection/Redirects ---
  if (authIsLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="font-mono text-lg text-white animate-pulse">AUTHENTICATING...</div>
      </div>
    );
  }

  if (isLoggedIn && user?.user_role === 'admin') {
    router.push('/admin');
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="font-mono text-lg text-white animate-pulse">REDIRECTING TO ADMIN CONSOLE...</div>
      </div>
    );
  }

  // --- D. Derived State & Helper Functions ---
  const filteredProducts = useMemo(() => {
    const sourceProducts = allProducts.filter(p => p.isBlockchain === showBlockchainProducts);

    return sourceProducts
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
  }, [allProducts, showBlockchainProducts, searchTerm, selectedCategory, sortBy]);

  const categories = useMemo(() => {
    const sourceProducts = allProducts.filter(p => p.isBlockchain === showBlockchainProducts);
    const uniqueCategories = [...new Set(sourceProducts.map(p => p.category).filter(Boolean))];
    return [{ label: 'All Categories', value: 'all' }, ...uniqueCategories.map(c => ({ label: c, value: c }))];
  }, [allProducts, showBlockchainProducts]);

  const handleAddToCart = async (product: DisplayProduct) => {
    if (product.isBlockchain) {
      alert("On-chain assets must be purchased directly from their detail page.");
      router.push(`/products/${product.id}`);
      return;
    }
    try {
      const dbId = parseInt(product.id.replace('db-', ''));
      await addToCart(dbId, 1);
      // This could be replaced with a toast notification
      alert(`${product.name} added to cart!`);
    } catch (err) {
      console.error('Add to cart error:', err);
      alert('Failed to add item to cart.');
    }
  };

  // --- E. Render JSX ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <section className="text-center py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Decentralized Supply Chain Marketplace
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Transparent transactions, direct-to-producer sourcing, and unparalleled security powered by the blockchain.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowBlockchainProducts(!showBlockchainProducts)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-transform transform hover:scale-105"
            >
              {showBlockchainProducts ? 'View Off-Chain Products' : 'Explore On-Chain Assets'}
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by name or seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Sort by Price: Low to High</option>
              <option value="price-high">Sort by Price: High to Low</option>
              <option value="rating">Sort by Rating</option>
            </select>
          </div>
        </section>

        <section>
          {productsLoading ? (
            <div className="text-center py-12 text-gray-500">Loading products...</div>
          ) : productsError ? (
            <div className="text-center py-12 text-red-500">Error: {productsError}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                    cartLoading={cartLoading}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <h3 className="text-xl font-semibold">No products found</h3>
                  <p>Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}