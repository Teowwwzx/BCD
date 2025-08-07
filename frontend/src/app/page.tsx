'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useCart } from '../contexts/CartContext';
import { useProducts, DisplayProduct } from '../hooks/useProducts';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { getTotalListings, getListing, formatEther, purchaseProduct } from '../lib/web3';

// interface BlockchainProduct {
//   listingId: number;
//   seller: string;
//   name: string;
//   description: string;
//   category: string;
//   price: bigint;
//   quantity: number;
//   location: string;
//   imageUrl: string;
//   status: number;
//   createdAt: number;
// }

export default function Home() {
  const { allProducts, loading, error, refetchProducts } = useProducts();

  const { isLoggedIn, walletAddress } = useWallet();
  const { addToCart, loading: cartLoading } = useCart();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  // const [blockchainProducts, setBlockchainProducts] = useState<BlockchainProduct[]>([]);
  // const [loadingBlockchain, setLoadingBlockchain] = useState(false);
  // const [blockchainError, setBlockchainError] = useState<string | null>(null);
  const [showBlockchainProducts, setShowBlockchainProducts] = useState(false);
  const [categories, setCategories] = useState<{ label: string, value: string }[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<DisplayProduct[]>([]);

  useEffect(() => {
    // First, select the source of products (DB or Blockchain)
    const sourceProducts = allProducts.filter(p => p.isBlockchain === showBlockchainProducts);

    // Then, apply filters and sorting to the selected source
    const filtered = sourceProducts
      .filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.seller.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category.toLowerCase() === selectedCategory.toLowerCase();
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-low':
            return a.price - b.price;
          case 'price-high':
            return b.price - a.price;
          case 'rating':
            return b.rating - a.rating;
          case 'name':
          default:
            return a.name.localeCompare(b.name);
        }
      });

    setFilteredProducts(filtered);

    // Dynamically generate the category list from all available products
    if (allProducts.length > 0) {
      const uniqueCategories = [...new Set(allProducts.map(p => p.category))];
      const categoryOptions = [
        { label: 'All Categories', value: 'all' },
        ...uniqueCategories.map(c => ({ label: c, value: c }))
      ];
      setCategories(categoryOptions);
    }

  }, [allProducts, searchTerm, selectedCategory, sortBy, showBlockchainProducts]);

  const handleAddToCart = async (product: DisplayProduct) => {
    try {
      const productId = parseInt(product.id.replace('db-', ''));
      await addToCart(productId, 1);
      alert(`${product.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const handleBlockchainPurchase = async (product: DisplayProduct) => {
    if (!walletAddress || !product.blockchainData) return;
    try {
      // We need to format the price back to a string for the purchase function
      const totalPriceString = product.price.toString();
      await purchaseProduct(product.blockchainData.listingId, 1, totalPriceString);
      await refetchProducts(); // Use the refetch function from the hook
    } catch (err: any) {
      console.error('Purchase error:', err);
      alert(`Purchase failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Decentralized Supply Chain Marketplace
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Connect directly with local farmers and producers. Fresh, sustainable, and transparent.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowBlockchainProducts(true)}
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Explore Blockchain Products
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors">
                Become a Seller
              </button>
            </div>
          </div>
        </section>

        {/* Product Source Toggle */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Source:</span>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setShowBlockchainProducts(false)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${!showBlockchainProducts
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    Demo Products
                  </button>
                  <button
                    onClick={() => {
                      setShowBlockchainProducts(true);
                      refetchProducts(); // Use the refetch function from the hook
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${showBlockchainProducts
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    Blockchain Products
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={refetchProducts} // Use the refetch function
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Refresh All'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Products
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by product or seller..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price-low">Price (Low to High)</option>
                  <option value="price-high">Price (High to Low)</option>
                  <option value="rating">Rating (High to Low)</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {showBlockchainProducts ? 'Blockchain Products' : 'Featured Products'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Loading products...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Products</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={refetchProducts}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No products found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => {
                    if (product.isBlockchain) {
                      handleBlockchainPurchase(product);
                    } else {
                      handleAddToCart(product);
                    }
                  }}
                  loading={cartLoading}
                  isBlockchain={product.isBlockchain}
                  requiresWallet={product.isBlockchain && !walletAddress}
                />
              ))}
            </div>
          )}
        </section>

        {/* Features Section (No changes needed here) */}
        <section className="bg-white dark:bg-gray-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="text-center mb-12">

              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">

                Why Choose Our Marketplace?

              </h2>

              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">

                Experience the future of food commerce with blockchain-powered transparency and direct farmer connections.

              </p>

            </div>



            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              <div className="text-center">

                <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">

                  <span className="text-2xl">🌱</span>

                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">

                  Fresh & Local

                </h3>

                <p className="text-gray-600 dark:text-gray-400">

                  Direct from local farms to your table, ensuring maximum freshness and supporting your community.

                </p>

              </div>



              <div className="text-center">

                <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">

                  <span className="text-2xl">🔗</span>

                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">

                  Blockchain Verified

                </h3>

                <p className="text-gray-600 dark:text-gray-400">

                  Complete transparency with blockchain technology tracking every step from farm to your door.

                </p>

              </div>



              <div className="text-center">

                <div className="bg-purple-100 dark:bg-purple-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">

                  <span className="text-2xl">🤝</span>

                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">

                  Fair Trade

                </h3>

                <p className="text-gray-600 dark:text-gray-400">

                  Direct payments to farmers ensure fair compensation and sustainable farming practices.

                </p>

              </div>

            </div>

          </div>

        </section>
      </main>

      <Footer />
    </div>
  );
}
