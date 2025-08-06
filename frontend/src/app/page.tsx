'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useCart } from '../contexts/CartContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { 
  getTotalListings, 
  getListing, 
  formatEther, 
  purchaseProduct 
} from '../lib/web3';

interface BlockchainProduct {
  listingId: number;
  seller: string;
  name: string;
  description: string;
  category: string;
  price: bigint;
  quantity: number;
  location: string;
  imageUrl: string;
  status: number;
  createdAt: number;
}

export default function Home() {
  const { isLoggedIn, walletAddress } = useWallet();
  const { addToCart, loading } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [blockchainProducts, setBlockchainProducts] = useState<BlockchainProduct[]>([]);
  const [loadingBlockchain, setLoadingBlockchain] = useState(false);
  const [blockchainError, setBlockchainError] = useState<string | null>(null);
  const [showBlockchainProducts, setShowBlockchainProducts] = useState(false);

  const featuredProducts = [
    {
      id: 1,
      name: 'Organic Apples',
      price: 4.99,
      seller: 'Green Valley Farm',
      rating: 4.8,
      description: 'Fresh, crispy organic apples straight from our orchard.',
      category: 'fruits',
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=200&fit=crop',
      inStock: true
    },
    {
      id: 2,
      name: 'Free Range Eggs',
      price: 6.50,
      seller: 'Happy Hens Farm',
      rating: 4.9,
      description: 'Farm-fresh eggs from free-range chickens.',
      category: 'dairy',
      image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=200&fit=crop',
      inStock: true
    },
    {
      id: 3,
      name: 'Artisan Bread',
      price: 5.25,
      seller: 'Village Bakery',
      rating: 4.7,
      description: 'Handcrafted sourdough bread baked daily.',
      category: 'bakery',
      image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=300&h=200&fit=crop',
      inStock: true
    },
    {
      id: 4,
      name: 'Local Honey',
      price: 12.99,
      seller: 'Bee Happy Apiaries',
      rating: 4.9,
      description: 'Pure, raw honey harvested from local wildflowers.',
      category: 'pantry',
      image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=200&fit=crop',
      inStock: true
    }
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'dairy', label: 'Dairy' },
    { value: 'meat', label: 'Meat' },
    { value: 'bakery', label: 'Bakery' },
    { value: 'pantry', label: 'Pantry' }
  ];

  // Load blockchain products
  const loadBlockchainProducts = async () => {
    setLoadingBlockchain(true);
    setBlockchainError(null);
    
    try {
      const totalListings = await getTotalListings();
      const products: BlockchainProduct[] = [];
      
      for (let i = 0; i < Number(totalListings); i++) {
        try {
          const listing = await getListing(i);
          // Only show active listings (status 0)
          if (Number(listing[9]) === 0) {
            products.push({
              listingId: Number(listing[0]),
              seller: listing[1],
              name: listing[2],
              description: listing[3],
              category: listing[4],
              price: listing[5],
              quantity: Number(listing[6]),
              location: listing[7],
              imageUrl: listing[8],
              status: Number(listing[9]),
              createdAt: Number(listing[10])
            });
          }
        } catch (err) {
          console.error(`Error loading listing ${i}:`, err);
        }
      }
      
      setBlockchainProducts(products);
    } catch (err: any) {
      console.error('Error loading blockchain products:', err);
      setBlockchainError(err.message || 'Failed to load blockchain products');
    } finally {
      setLoadingBlockchain(false);
    }
  };

  // Convert blockchain products to display format
  const convertBlockchainProduct = (product: BlockchainProduct) => ({
    id: `blockchain-${product.listingId}`,
    name: product.name,
    price: parseFloat(formatEther(product.price)),
    seller: `${product.seller.slice(0, 6)}...${product.seller.slice(-4)}`,
    rating: 4.5, // Default rating for blockchain products
    description: product.description,
    category: product.category.toLowerCase(),
    image: product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop',
    inStock: product.quantity > 0,
    isBlockchain: true,
    blockchainData: product
  });

  // Get products to display
  const getProductsToDisplay = () => {
    if (showBlockchainProducts) {
      return blockchainProducts.map(convertBlockchainProduct);
    }
    return featuredProducts;
  };

  // Filter and sort products
  const filteredProducts = getProductsToDisplay()
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.seller.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
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

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      seller: product.seller,
      image: product.image,
      quantity: 1
    });
  };

  const handleBlockchainPurchase = async (product: any) => {
    if (!walletAddress || !product.isBlockchain) return;
    
    try {
      const blockchainData = product.blockchainData;
      const totalPrice = formatEther(blockchainData.price);
      
      await purchaseProduct(blockchainData.listingId, 1, totalPrice);
      
      // Reload blockchain products after purchase
      await loadBlockchainProducts();
      
    } catch (err: any) {
      console.error('Purchase error:', err);
      alert(`Purchase failed: ${err.message}`);
    }
  };

  // Load blockchain products on component mount
  useEffect(() => {
    loadBlockchainProducts();
  }, []);

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
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      !showBlockchainProducts
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Demo Products
                  </button>
                  <button
                    onClick={() => {
                      setShowBlockchainProducts(true);
                      loadBlockchainProducts();
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      showBlockchainProducts
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Blockchain Products
                  </button>
                </div>
              </div>
              
              {showBlockchainProducts && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {blockchainProducts.length} blockchain listings
                  </span>
                  <button
                    onClick={loadBlockchainProducts}
                    disabled={loadingBlockchain}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                  >
                    {loadingBlockchain ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              )}
            </div>
            
            {blockchainError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{blockchainError}</p>
              </div>
            )}
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
          
          {loadingBlockchain && showBlockchainProducts ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Loading blockchain products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {showBlockchainProducts 
                  ? 'No blockchain products found. Try creating some listings in the admin panel!' 
                  : 'No products found matching your criteria.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => {
                    if (product.isBlockchain && walletAddress) {
                      handleBlockchainPurchase(product);
                    } else {
                      handleAddToCart(product);
                    }
                  }}
                  loading={loading}
                  isBlockchain={product.isBlockchain}
                  requiresWallet={product.isBlockchain && !walletAddress}
                />
              ))}
            </div>
          )}
        </section>

        {/* Features Section */}
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
