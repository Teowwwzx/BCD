'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';

interface Product {
  id: number;
  name: string;
  price: string;
  image?: string;
  seller: string;
  rating: number;
  description: string;
  category: string;
  inStock: boolean;
}

interface FilterState {
  category: string;
  priceRange: string;
  rating: number;
  sortBy: string;
  searchQuery: string;
}

const ProductsPage: React.FC = () => {
  const { isLoggedIn } = useWallet();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    priceRange: 'all',
    rating: 0,
    sortBy: 'newest',
    searchQuery: ''
  });

  // Mock product data
  const mockProducts: Product[] = [
    {
      id: 1,
      name: "Premium Wireless Headphones",
      price: "0.15 ETH",
      seller: "TechStore",
      rating: 4.8,
      description: "High-quality wireless headphones with noise cancellation and premium sound quality.",
      category: "Electronics",
      inStock: true
    },
    {
      id: 2,
      name: "Smart Fitness Watch",
      price: "0.08 ETH",
      seller: "FitGear",
      rating: 4.6,
      description: "Advanced fitness tracking with heart rate monitoring and GPS.",
      category: "Electronics",
      inStock: true
    },
    {
      id: 3,
      name: "Organic Coffee Beans",
      price: "0.02 ETH",
      seller: "CoffeeCo",
      rating: 4.9,
      description: "Premium organic coffee beans sourced from sustainable farms.",
      category: "Food & Beverage",
      inStock: true
    },
    {
      id: 4,
      name: "Handcrafted Leather Wallet",
      price: "0.05 ETH",
      seller: "ArtisanCraft",
      rating: 4.7,
      description: "Genuine leather wallet handcrafted by skilled artisans.",
      category: "Fashion",
      inStock: true
    },
    {
      id: 5,
      name: "Gaming Mechanical Keyboard",
      price: "0.12 ETH",
      seller: "GameTech",
      rating: 4.5,
      description: "RGB mechanical keyboard perfect for gaming and productivity.",
      category: "Electronics",
      inStock: false
    },
    {
      id: 6,
      name: "Vintage Vinyl Records Collection",
      price: "0.25 ETH",
      seller: "VinylVault",
      rating: 4.9,
      description: "Rare collection of vintage vinyl records from the 70s and 80s.",
      category: "Collectibles",
      inStock: true
    },
    {
      id: 7,
      name: "Sustainable Bamboo Phone Case",
      price: "0.03 ETH",
      seller: "EcoTech",
      rating: 4.4,
      description: "Eco-friendly phone case made from sustainable bamboo.",
      category: "Accessories",
      inStock: true
    },
    {
      id: 8,
      name: "Professional Camera Lens",
      price: "0.45 ETH",
      seller: "PhotoPro",
      rating: 4.8,
      description: "Professional grade camera lens for stunning photography.",
      category: "Electronics",
      inStock: true
    }
  ];

  const categories = ['all', 'Electronics', 'Fashion', 'Food & Beverage', 'Collectibles', 'Accessories'];
  const priceRanges = [
    { label: 'All Prices', value: 'all' },
    { label: 'Under 0.05 ETH', value: '0-0.05' },
    { label: '0.05 - 0.15 ETH', value: '0.05-0.15' },
    { label: '0.15 - 0.30 ETH', value: '0.15-0.30' },
    { label: 'Over 0.30 ETH', value: '0.30+' }
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Highest Rated', value: 'rating' },
    { label: 'Most Popular', value: 'popular' }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = [...products];

    // Apply filters
    if (filters.category !== 'all') {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(p => {
        if (p === '0.30+') return [0.30, Infinity];
        return parseFloat(p);
      });
      
      filtered = filtered.filter(product => {
        const price = parseFloat(product.price.replace(' ETH', ''));
        if (filters.priceRange === '0.30+') return price >= 0.30;
        return price >= min && price <= max;
      });
    }

    if (filters.rating > 0) {
      filtered = filtered.filter(product => product.rating >= filters.rating);
    }

    if (filters.searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        product.seller.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => parseFloat(a.price.replace(' ETH', '')) - parseFloat(b.price.replace(' ETH', '')));
        break;
      case 'price-desc':
        filtered.sort((a, b) => parseFloat(b.price.replace(' ETH', '')) - parseFloat(a.price.replace(' ETH', '')));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'popular':
        filtered.sort((a, b) => b.rating - a.rating); // Mock popularity with rating
        break;
      default:
        filtered.sort((a, b) => b.id - a.id); // Newest first
    }

    setFilteredProducts(filtered);
  }, [products, filters]);

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAddToCart = async (productId: number) => {
    if (!isLoggedIn) {
      alert('Please log in to add items to your cart');
      return;
    }
    // TODO: Implement add to cart functionality
    console.log('Adding product to cart:', productId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      priceRange: 'all',
      rating: 0,
      sortBy: 'newest',
      searchQuery: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Products</h1>
          <p className="text-gray-600">Discover amazing products from verified sellers on the blockchain</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Clear All
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {priceRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map(rating => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={filters.rating === rating}
                        onChange={(e) => handleFilterChange('rating', parseInt(e.target.value))}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-sm text-gray-600">& up</span>
                      </div>
                    </label>
                  ))}
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="rating"
                      value={0}
                      checked={filters.rating === 0}
                      onChange={(e) => handleFilterChange('rating', parseInt(e.target.value))}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">All Ratings</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Sort and Results Count */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <p className="text-gray-600 mb-4 sm:mb-0">
                {loading ? 'Loading...' : `${filteredProducts.length} products found`}
              </p>
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded mb-3 w-1/2"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.306a7.962 7.962 0 00-6 0m6 0V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2.306" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductsPage;