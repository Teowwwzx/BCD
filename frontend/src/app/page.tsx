'use client';

import Image from 'next/image';
import { useWallet } from '../contexts/WalletContext';
import { useCart } from '../contexts/CartContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const { isLoggedIn } = useWallet();
  const { addToCart, loading } = useCart();

  const featuredProducts = [
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
    }
  ];

  const handleAddToCart = async (productId: number) => {
    if (!isLoggedIn) {
      alert('Please log in to add items to your cart');
      return;
    }
    
    try {
      await addToCart(productId, 1);
      alert('Product added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Decentralized Commerce
              <span className="block text-yellow-300">Redefined</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Buy and sell with confidence on the blockchain. Secure, transparent, and truly decentralized marketplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/products"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center"
              >
                Start Shopping
              </a>
              <a 
                href="/sell"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors text-center"
              >
                Become a Seller
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose BCD Marketplace?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Experience the future of commerce with blockchain technology</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Transactions</h3>
              <p className="text-gray-600">All transactions are secured by blockchain technology and smart contracts</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Transparent</h3>
              <p className="text-gray-600">Every transaction is recorded on the blockchain for complete transparency</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast & Efficient</h3>
              <p className="text-gray-600">Lightning-fast transactions with minimal fees</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-gray-600">Discover amazing products from verified sellers</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
          <div className="text-center mt-8">
            <a 
              href="/products"
              className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors inline-block"
            >
              View All Products
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-200">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-200">Products Listed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-blue-200">Transactions</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-200">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
