'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import {
  createListing,
  purchaseProduct,
  getListing,
  getUserListings,
  getUserOrders,
  getTotalListings,
  formatEther,
  parseEther,
  getOrder,
  confirmDelivery,
  confirmCompletion
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

interface BlockchainOrder {
  orderId: number;
  listingId: number;
  buyer: string;
  seller: string;
  transporter: string;
  finalPrice: bigint;
  quantityPurchased: number;
  status: number;
  createdAt: number;
  escrowAmount: bigint;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
}

const BlockchainIntegration: React.FC = () => {
  const { walletAddress, isLoggedIn } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State for blockchain data
  const [userListings, setUserListings] = useState<BlockchainProduct[]>([]);
  const [userOrders, setUserOrders] = useState<BlockchainOrder[]>([]);
  const [totalListings, setTotalListings] = useState<number>(0);
  
  // Form state for creating listings
  const [listingForm, setListingForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    quantity: 1,
    location: '',
    imageUrl: ''
  });

  // Load user's blockchain data
  const loadUserData = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      // Get user's listings
      const listingIds = await getUserListings(walletAddress);
      const listings: BlockchainProduct[] = [];
      
      for (const id of listingIds) {
        const listing = await getListing(Number(id));
        listings.push({
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
      setUserListings(listings);
      
      // Get user's orders
      const orderIds = await getUserOrders(walletAddress);
      const orders: BlockchainOrder[] = [];
      
      for (const id of orderIds) {
        const order = await getOrder(Number(id));
        orders.push({
          orderId: Number(order[0]),
          listingId: Number(order[1]),
          buyer: order[2],
          seller: order[3],
          transporter: order[4],
          finalPrice: order[5],
          quantityPurchased: Number(order[6]),
          status: Number(order[7]),
          createdAt: Number(order[8]),
          escrowAmount: order[9],
          buyerConfirmed: order[10],
          sellerConfirmed: order[11]
        });
      }
      setUserOrders(orders);
      
      // Get total listings count
      const total = await getTotalListings();
      setTotalListings(Number(total));
      
    } catch (err: any) {
      setError(`Error loading blockchain data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create a new listing on blockchain
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const receipt = await createListing(
        listingForm.name,
        listingForm.description,
        listingForm.category,
        listingForm.price,
        listingForm.quantity,
        listingForm.location,
        listingForm.imageUrl
      );
      
      setSuccess(`Listing created successfully! Transaction hash: ${receipt.hash}`);
      setListingForm({
        name: '',
        description: '',
        category: '',
        price: '',
        quantity: 1,
        location: '',
        imageUrl: ''
      });
      
      // Reload user data
      await loadUserData();
      
    } catch (err: any) {
      setError(`Error creating listing: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Purchase a product
  const handlePurchase = async (listingId: number, quantity: number, price: bigint) => {
    if (!isLoggedIn) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const totalPrice = formatEther(price * BigInt(quantity));
      const receipt = await purchaseProduct(listingId, quantity, totalPrice);
      
      setSuccess(`Purchase successful! Transaction hash: ${receipt.hash}`);
      await loadUserData();
      
    } catch (err: any) {
      setError(`Error purchasing product: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Confirm delivery
  const handleConfirmDelivery = async (orderId: number) => {
    setLoading(true);
    try {
      const receipt = await confirmDelivery(orderId);
      setSuccess(`Delivery confirmed! Transaction hash: ${receipt.hash}`);
      await loadUserData();
    } catch (err: any) {
      setError(`Error confirming delivery: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Confirm completion
  const handleConfirmCompletion = async (orderId: number) => {
    setLoading(true);
    try {
      const receipt = await confirmCompletion(orderId);
      setSuccess(`Order completed! Transaction hash: ${receipt.hash}`);
      await loadUserData();
    } catch (err: any) {
      setError(`Error confirming completion: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load data when wallet connects
  useEffect(() => {
    if (walletAddress) {
      loadUserData();
    }
  }, [walletAddress]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const getStatusText = (status: number) => {
    const statuses = ['Active', 'Sold', 'Cancelled'];
    return statuses[status] || 'Unknown';
  };

  const getOrderStatusText = (status: number) => {
    const statuses = [
      'Awaiting Payment',
      'Awaiting Shipment', 
      'In Transit',
      'Delivered',
      'Completed',
      'Disputed',
      'Cancelled'
    ];
    return statuses[status] || 'Unknown';
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please connect your wallet to access blockchain features.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Blockchain Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Blockchain Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Listings:</span> {totalListings}
          </div>
          <div>
            <span className="font-medium">Your Listings:</span> {userListings.length}
          </div>
          <div>
            <span className="font-medium">Your Orders:</span> {userOrders.length}
          </div>
        </div>
      </div>

      {/* Create Listing Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Create Blockchain Listing</h3>
        <form onSubmit={handleCreateListing} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Product Name"
              value={listingForm.name}
              onChange={(e) => setListingForm({...listingForm, name: e.target.value})}
              className="border border-gray-300 rounded-lg px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Category"
              value={listingForm.category}
              onChange={(e) => setListingForm({...listingForm, category: e.target.value})}
              className="border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          
          <textarea
            placeholder="Description"
            value={listingForm.description}
            onChange={(e) => setListingForm({...listingForm, description: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            rows={3}
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="number"
              step="0.001"
              placeholder="Price (ETH)"
              value={listingForm.price}
              onChange={(e) => setListingForm({...listingForm, price: e.target.value})}
              className="border border-gray-300 rounded-lg px-3 py-2"
              required
            />
            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={listingForm.quantity}
              onChange={(e) => setListingForm({...listingForm, quantity: parseInt(e.target.value)})}
              className="border border-gray-300 rounded-lg px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Location"
              value={listingForm.location}
              onChange={(e) => setListingForm({...listingForm, location: e.target.value})}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          
          <input
            type="url"
            placeholder="Image URL"
            value={listingForm.imageUrl}
            onChange={(e) => setListingForm({...listingForm, imageUrl: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Listing'}
          </button>
        </form>
      </div>

      {/* User's Listings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Your Blockchain Listings</h3>
        {userListings.length === 0 ? (
          <p className="text-gray-500">No listings found.</p>
        ) : (
          <div className="space-y-4">
            {userListings.map((listing) => (
              <div key={listing.listingId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{listing.name}</h4>
                    <p className="text-sm text-gray-600">{listing.description}</p>
                    <p className="text-sm">Price: {formatEther(listing.price)} ETH</p>
                    <p className="text-sm">Quantity: {listing.quantity}</p>
                    <p className="text-sm">Status: {getStatusText(listing.status)}</p>
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    ID: {listing.listingId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User's Orders */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Your Blockchain Orders</h3>
        {userOrders.length === 0 ? (
          <p className="text-gray-500">No orders found.</p>
        ) : (
          <div className="space-y-4">
            {userOrders.map((order) => (
              <div key={order.orderId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm">Order ID: {order.orderId}</p>
                    <p className="text-sm">Listing ID: {order.listingId}</p>
                    <p className="text-sm">Price: {formatEther(order.finalPrice)} ETH</p>
                    <p className="text-sm">Quantity: {order.quantityPurchased}</p>
                    <p className="text-sm">Status: {getOrderStatusText(order.status)}</p>
                    <p className="text-sm">Buyer: {order.buyer}</p>
                    <p className="text-sm">Seller: {order.seller}</p>
                  </div>
                  <div className="space-y-2">
                    {order.status === 3 && order.buyer === walletAddress && !order.buyerConfirmed && (
                      <button
                        onClick={() => handleConfirmDelivery(order.orderId)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        disabled={loading}
                      >
                        Confirm Delivery
                      </button>
                    )}
                    {order.status === 3 && order.seller === walletAddress && !order.sellerConfirmed && (
                      <button
                        onClick={() => handleConfirmCompletion(order.orderId)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        disabled={loading}
                      >
                        Confirm Completion
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainIntegration;