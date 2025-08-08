'use client';

import React, { useState, useMemo } from 'react'; //_ Changed: No longer need useEffect here, useMemo is better
import { ethers } from 'ethers'; //_ Added: To handle price conversion
import { useWallet } from '../contexts/WalletContext';
import { useCart } from '../contexts/CartContext';
import { useProducts, DisplayProduct } from '../hooks/useProducts';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { purchaseProduct } from '../lib/web3';

export default function Home() {
  const [showBlockchainProducts, setShowBlockchainProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const { allProducts, loading, error, refetchProducts } = useProducts();
  const { addToCart, loading: cartLoading } = useCart();
  const { walletAddress } = useWallet();


  const filteredProducts = useMemo(() => {
    const sourceProducts = allProducts.filter(p => p.isBlockchain === showBlockchainProducts);

    return sourceProducts
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
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [allProducts, showBlockchainProducts, searchTerm, selectedCategory, sortBy]);

  //_ Also derive the categories list directly.
  const categories = useMemo(() => {
    if (allProducts.length === 0) return [{ label: 'All Categories', value: 'all' }];
    const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
    return [
      { label: 'All Categories', value: 'all' },
      ...uniqueCategories.map(c => ({ label: c, value: c }))
    ];
  }, [allProducts]);

  const handleAddToCart = async (product: DisplayProduct) => {
    // This function was already well-written, no changes needed.
    try {
      const productId = parseInt(product.id.replace('db-', ''));
      await addToCart(productId, 1);
      alert(`${product.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  //_ REVISION 2: Correctly handle the payment value for the blockchain transaction.
  const handleBlockchainPurchase = async (product: DisplayProduct) => {
    if (!walletAddress || !product.blockchainData) {
      alert('Please connect your wallet to purchase blockchain items.');
      return;
    }

    try {
      //_ The smart contract's `payable` function receives ETH via the `value`
      //_ field of the transaction, not as a function argument.
      //_ We must convert the price (e.g., "0.5") into wei (e.g., 500000000000000000).
      const priceInWei = ethers.parseEther(product.price.toString());

      console.log(`Attempting to purchase listing ${product.blockchainData.listingId} for ${priceInWei.toString()} wei...`);

      //_ Call the function with its required arguments (_listingId, _quantity) and pass
      //_ the payment amount in the options object.
      await purchaseProduct(
        product.blockchainData.listingId,
        1, // Assuming quantity is 1 for now
        { value: priceInWei } // The transaction options object
      );

      alert('Purchase successful! Transaction sent.');
      await refetchProducts();
    } catch (err: any) {
      console.error('Purchase error:', err);
      // Provide a more user-friendly error message
      const message = err.reason || err.message || "An unknown error occurred.";
      alert(`Purchase failed: ${message}`);
    }
  };

  return (
    //_ Main container with a dark background and a subtle scan-line effect
    <div className="min-h-screen bg-[#0d0221] text-[#00f5c3] font-mono-pixel">
      <Header />

      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="text-center py-20 md:py-32">
          {/*_ Glitch effect wrapper for the main title */}
          <div className="relative inline-block mb-6">
            <h1 className="font-pixel text-4xl md:text-6xl text-white relative z-10">
              DECENTRALIZED
            </h1>
            {/*_ The "glitch" layers */}
            <h1 className="font-pixel text-4xl md:text-6xl text-[#f0f] absolute top-0 left-0 z-0 -translate-x-0.5 -translate-y-0.5">
              DECENTRALIZED
            </h1>
            <h1 className="font-pixel text-4xl md:text-6xl text-[#0ff] absolute top-0 left-0 z-0 translate-x-0.5 translate-y-0.5">
              DECENTRALIZED
            </h1>
          </div>
          <h2 className="font-pixel text-3xl md:text-5xl text-white mb-8">
            SUPPLY-CHAIN
          </h2>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-gray-300">
            TRANSPARENT_TRANSACTIONS :: DIRECT_TO_PRODUCER :: BIO-ENHANCED_GOODS
          </p>

          {/*_ Pixelated buttons with hard edges and hover effects */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowBlockchainProducts(true)}
              className="bg-[#00f5c3] text-black px-8 py-3 font-pixel text-sm hover:bg-white hover:text-black border-2 border-[#00f5c3] transition-colors"
            >
              [ EXPLORE_CHAIN ]
            </button>
            <button className="border-2 border-[#00f5c3] text-white px-8 py-3 font-pixel text-sm hover:bg-[#00f5c3] hover:text-black transition-colors">
              [ BECOME_A_VENDOR ]
            </button>
          </div>
        </section>

        {/* Filter & Product Section Wrapper */}
        {/*_ A container with a "pixelated" border effect */}
        <div className="p-1 bg-gradient-to-br from-[#f0f] to-[#0ff] mb-16">
          <div className="bg-[#0d0221] p-4 md:p-6">

            {/* Search and Filter Section */}
            <section className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/*_ Inputs styled like a retro terminal */}
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

              {loading ? (
                //_ A retro loading animation
                <div className="text-center py-12">
                  <p className="font-pixel text-lg animate-pulse">LOADING_RESOURCES...</p>
                </div>
              ) : error ? (
                //_ A retro error message
                <div className="text-center py-12 border-2 border-red-500 p-4">
                  <h3 className="text-lg font-pixel text-red-500 mb-2">[SYSTEM_ERROR]</h3>
                  <p className="text-red-400 mb-4">{error}</p>
                  <button onClick={refetchProducts} className="font-pixel text-sm bg-red-500 text-white px-4 py-2 hover:bg-red-400">[RETRY]</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    // The component call is now much cleaner and will have no errors.
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
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
