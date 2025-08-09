// frontend/src/app/page.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// --- Core Principles In Action ---
// 1. Import order: React/Next -> Hooks -> Components -> Types
import { useAuth } from '../hooks/useAuth';
import { useProducts, DisplayProduct } from '../hooks/useProducts'; // Use our powerful, unified hook
import { useCart } from '../contexts/CartContext'; // Use the hook, not the context directly
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

export default function Home() {
  // --- A. Consume Hooks ---
  // We rename destructured properties to be specific and avoid conflicts.
  const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { allProducts, loading: productsLoading, error, refetchProducts } = useProducts();
  const { addToCart } = useCart();
  const router = useRouter();

  // --- B. Manage UI-Specific State ---
  // This is the page's ONLY responsibility besides rendering.
  const [showBlockchainProducts, setShowBlockchainProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');



  // --- D. Derived State & Helper Functions ---
  // This logic is simple and directly related to filtering the UI.
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
    const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
    return [{ label: 'All Categories', value: 'all' }, ...uniqueCategories.map(c => ({ label: c, value: c }))];
  }, [allProducts]);

    // --- C. Guard Clause for Page Protection/Redirects ---
  // This block handles loading and role-based redirects before rendering the main content.
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0d0221] flex items-center justify-center">
        <div className="font-pixel text-lg animate-pulse">AUTHENTICATING...</div>
      </div>
    );
  }

  if (isLoggedIn && user?.user_role === 'admin') {
    router.push('/admin');
    return ( // Return a loader while redirecting
      <div className="min-h-screen bg-[#0d0221] flex items-center justify-center">
        <div className="font-pixel text-lg animate-pulse">REDIRECTING_TO_ADMIN_CONSOLE...</div>
      </div>
    );
  }

  // The page passes the product to a handler, which calls the hook.
  const handleAddToCart = async (product: DisplayProduct) => {
    if (product.isBlockchain) {
      alert("On-chain assets must be purchased directly from their detail page.");
      router.push(`/products/${product.id}`);
      return;
    }
    try {
      const dbId = parseInt(product.id.replace('db-', ''));
      await addToCart(dbId, 1);
      // We can later connect this to a notification context
      alert(`${product.name} added to cart!`);
    } catch (err) {
      console.error('Add to cart error:', err);
      alert('Failed to add item to cart.');
    }
  };

  // --- E. Render JSX ---
  // The JSX is clean and easy to read.
  return (
    <div className="min-h-screen bg-[#0d0221] text-[#00f5c3] font-mono-pixel">
      <Header />
      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="text-center py-20 md:py-32">
          <div className="relative inline-block mb-6">
            <h1 className="font-pixel text-4xl md:text-6xl text-white relative z-10">DECENTRALIZED</h1>
            <h1 className="font-pixel text-4xl md:text-6xl text-[#f0f] absolute top-0 left-0 z-0 -translate-x-0.5 -translate-y-0.5">DECENTRALIZED</h1>
            <h1 className="font-pixel text-4xl md:text-6xl text-[#0ff] absolute top-0 left-0 z-0 translate-x-0.5 translate-y-0.5">DECENTRALIZED</h1>
          </div>
          <h2 className="font-pixel text-3xl md:text-5xl text-white mb-8">SUPPLY-CHAIN</h2>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-gray-300">
            TRANSPARENT_TRANSACTIONS :: DIRECT_TO_PRODUCER :: BIO-ENHANCED_GOODS
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowBlockchainProducts(true)}
              className="bg-[#00f5c3] text-black px-8 py-3 font-pixel text-sm hover:bg-white hover:text-black border-2 border-[#00f5c3] transition-colors"
            >
              [ EXPLORE_CHAIN ]
            </button>
            <button
              onClick={() => setShowBlockchainProducts(false)}
              className="border-2 border-[#00f5c3] text-white px-8 py-3 font-pixel text-sm hover:bg-[#00f5c3] hover:text-black transition-colors"
            >
              [ BROWSE_OFF-CHAIN ]
            </button>
          </div>
        </section>

        {/* Filter & Product Section */}
        <div className="p-1 bg-gradient-to-br from-[#f0f] to-[#0ff] mb-16">
          <div className="bg-[#0d0221] p-4 md:p-6">
            {/* Search and Filter Section */}
            <section className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="SEARCH_QUERY..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 bg-black border-2 border-[#30214f] text-[#00f5c3] focus:border-[#00f5c3] focus:outline-none placeholder:text-gray-500"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 bg-black border-2 border-[#30214f] text-[#00f5c3] focus:border-[#00f5c3] focus:outline-none"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value} className="bg-black text-[#00f5c3]">{category.label}</option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-3 bg-black border-2 border-[#30214f] text-[#00f5c3] focus:border-[#00f5c3] focus:outline-none"
                >
                  <option value="name">SORT: NAME</option>
                  <option value="price-low">SORT: PRICE_ASC</option>
                  <option value="price-high">SORT: PRICE_DESC</option>
                  <option value="rating">SORT: RATING</option>
                </select>
              </div>
            </section>

            {/* Products Section */}
            <section>
              <div className="flex justify-between items-center mb-6 border-b-2 border-dashed border-[#30214f] pb-4">
                <h2 className="text-2xl font-pixel text-white">
                  // {showBlockchainProducts ? 'ON-CHAIN_ASSETS' : 'DATABASE_LISTINGS'}
                </h2>
                <p className="text-gray-400">
                  {filteredProducts.length} ASSETS_FOUND
                </p>
              </div>

              {productsLoading ? (
                <div className="text-center py-12">
                  <p className="font-pixel text-lg animate-pulse">LOADING_RESOURCES...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12 border-2 border-red-500 p-4">
                  <h3 className="text-lg font-pixel text-red-500 mb-2">[SYSTEM_ERROR]</h3>
                  <p className="text-red-400 mb-4">{error}</p>
                  <button onClick={refetchProducts} className="font-pixel text-sm bg-red-500 text-white px-4 py-2 hover:bg-red-400">[RETRY]</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}