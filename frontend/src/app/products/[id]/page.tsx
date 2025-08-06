'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWallet } from '../../../contexts/WalletContext';
import { useCart } from '../../../contexts/CartContext';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { 
  getListing, 
  formatEther, 
  purchaseProduct 
} from '../../../lib/web3';

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
  isBlockchain?: boolean;
  location?: string;
  quantity?: number;
}

const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { walletAddress, isLoggedIn } = useWallet();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const productId = params.id as string;

  // Mock product data - in a real app, this would come from an API
  const mockProducts: Product[] = [
    {
      id: 1,
      name: "Premium Wireless Headphones",
      price: "0.15 ETH",
      seller: "TechStore",
      rating: 4.8,
      description: "High-quality wireless headphones with noise cancellation and premium sound quality. Features include 30-hour battery life, quick charge capability, and premium materials for maximum comfort during extended use.",
      category: "Electronics",
      inStock: true,
      location: "New York, USA",
      quantity: 25
    },
    {
      id: 2,
      name: "Smart Fitness Watch",
      price: "0.08 ETH",
      seller: "FitGear",
      rating: 4.6,
      description: "Advanced fitness tracking with heart rate monitoring and GPS. Track your workouts, monitor your health metrics, and stay connected with smart notifications. Water-resistant design perfect for all activities.",
      category: "Electronics",
      inStock: true,
      location: "California, USA",
      quantity: 15
    },
    {
      id: 3,
      name: "Organic Coffee Beans",
      price: "0.02 ETH",
      seller: "CoffeeCo",
      rating: 4.9,
      description: "Premium organic coffee beans sourced from sustainable farms. Single-origin beans with rich, complex flavors and ethical sourcing practices. Perfect for coffee enthusiasts who care about quality and sustainability.",
      category: "Food & Beverage",
      inStock: true,
      location: "Colombia",
      quantity: 100
    },
    {
      id: 4,
      name: "Handcrafted Leather Wallet",
      price: "0.05 ETH",
      seller: "ArtisanCraft",
      rating: 4.7,
      description: "Handcrafted leather wallet made from premium materials. Features multiple card slots, bill compartments, and RFID blocking technology. Each wallet is unique and made with attention to detail.",
      category: "Fashion",
      inStock: true,
      location: "Italy",
      quantity: 30
    }
  ];

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        
        // First try to find in mock data
        const mockProduct = mockProducts.find(p => p.id === parseInt(productId));
        if (mockProduct) {
          setProduct(mockProduct);
          setLoading(false);
          return;
        }

        // If not found in mock data, try blockchain
        if (walletAddress) {
          try {
            const blockchainProduct = await getListing(parseInt(productId));
            if (blockchainProduct && blockchainProduct.name) {
              setProduct({
                id: parseInt(productId),
                name: blockchainProduct.name,
                price: `${formatEther(blockchainProduct.price)} ETH`,
                seller: blockchainProduct.seller,
                rating: 4.5, // Default rating
                description: blockchainProduct.description || 'No description available',
                category: blockchainProduct.category || 'Uncategorized',
                inStock: blockchainProduct.quantity > 0,
                isBlockchain: true,
                location: blockchainProduct.location || 'Unknown',
                quantity: blockchainProduct.quantity
              });
            }
          } catch (error) {
            console.error('Error loading blockchain product:', error);
          }
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId, walletAddress]);

  const handleAddToCart = () => {
    if (product && !product.isBlockchain) {
      addToCart(product.id, quantity);
      alert('Product added to cart!');
    }
  };

  const handleBlockchainPurchase = async () => {
    if (!product || !walletAddress) return;
    
    try {
      setPurchasing(true);
      await purchaseProduct(product.id, quantity, product.price.replace(' ETH', ''));
      alert('Purchase successful!');
      router.push('/orders');
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/products')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Products
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const productImages = [
    product.image || '/api/placeholder/600/600',
    '/api/placeholder/600/600',
    '/api/placeholder/600/600'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-gray-500"
              >
                Home
              </button>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <button
                onClick={() => router.push('/products')}
                className="text-gray-400 hover:text-gray-500"
              >
                Products
              </button>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <span className="text-gray-900 font-medium">{product.name}</span>
            </li>
          </ol>
        </nav>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg shadow-sm overflow-hidden">
              <img
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-white rounded-lg shadow-sm overflow-hidden border-2 ${
                    selectedImage === index ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-gray-600">({product.rating})</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">Sold by {product.seller}</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 mb-4">{product.price}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-900">Category:</span>
                <span className="ml-2 text-gray-600">{product.category}</span>
              </div>
              <div>
                <span className="font-medium text-gray-900">Location:</span>
                <span className="ml-2 text-gray-600">{product.location}</span>
              </div>
              <div>
                <span className="font-medium text-gray-900">Stock:</span>
                <span className={`ml-2 ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                  {product.inStock ? `${product.quantity} available` : 'Out of stock'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-900">Type:</span>
                <span className="ml-2 text-gray-600">
                  {product.isBlockchain ? 'Blockchain' : 'Traditional'}
                </span>
              </div>
            </div>

            {/* Quantity and Purchase */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!product.inStock}
                >
                  {[...Array(Math.min(10, product.quantity || 1))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4">
                {product.isBlockchain ? (
                  <button
                    onClick={handleBlockchainPurchase}
                    disabled={!product.inStock || purchasing || !walletAddress}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {purchasing ? 'Processing...' : !walletAddress ? 'Connect Wallet' : 'Buy Now'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleAddToCart}
                      disabled={!product.inStock}
                      className="flex-1 border border-blue-600 text-blue-600 py-3 px-6 rounded-lg font-medium hover:bg-blue-50 disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => {
                        if (!isLoggedIn) {
                          router.push('/auth');
                          return;
                        }
                        handleAddToCart();
                        router.push('/cart');
                      }}
                      disabled={!product.inStock}
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Buy Now
                    </button>
                  </>
                )}
              </div>

              {!isLoggedIn && (
                <p className="text-sm text-gray-600">
                  Please <button onClick={() => router.push('/auth')} className="text-blue-600 hover:underline">sign in</button> to make a purchase.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Free shipping on orders over 0.1 ETH</li>
              <li>• Standard delivery: 3-5 business days</li>
              <li>• Express delivery available</li>
              <li>• International shipping supported</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Return Policy</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 30-day return window</li>
              <li>• Items must be in original condition</li>
              <li>• Free returns for defective items</li>
              <li>• Refunds processed within 5-7 days</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Security & Trust</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Blockchain-verified transactions</li>
              <li>• Escrow protection available</li>
              <li>• Seller verification required</li>
              <li>• Dispute resolution system</li>
            </ul>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ProductDetailPage;