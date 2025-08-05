'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '../../contexts/WalletContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

interface Order {
  id: string;
  date: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: string;
  items: {
    name: string;
    quantity: number;
    price: string;
  }[];
}

interface UserProfile {
  name: string;
  email: string;
  walletAddress: string;
  joinDate: string;
  totalOrders?: number;
  totalSpent?: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoggedIn, updateUser, isWalletConnected, walletAddress, connectWallet } = useWallet();
  const router = useRouter();
  
  // Local state for editing
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  
  // Orders state - must be declared before any early returns
  const [orders] = useState<Order[]>([
    {
      id: 'ORD-001',
      date: '2024-01-20',
      status: 'delivered',
      total: '0.15 ETH',
      items: [
        { name: 'Premium Wireless Headphones', quantity: 1, price: '0.15 ETH' }
      ]
    },
    {
      id: 'ORD-002',
      date: '2024-01-18',
      status: 'shipped',
      total: '0.16 ETH',
      items: [
        { name: 'Smart Fitness Watch', quantity: 2, price: '0.08 ETH' }
      ]
    },
    {
      id: 'ORD-003',
      date: '2024-01-15',
      status: 'pending',
      total: '0.07 ETH',
      items: [
        { name: 'Organic Coffee Beans', quantity: 2, price: '0.02 ETH' },
        { name: 'Handcrafted Leather Wallet', quantity: 1, price: '0.05 ETH' }
      ]
    }
  ]);
  
  // Handle authentication state loading and redirect
  useEffect(() => {
    // Give time for localStorage to load
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!isLoggedIn) {
        router.push('/auth');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isLoggedIn, router]);
  
  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name,
        email: user.email
      });
    }
  }, [user]);
  
  if (isLoading || !isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  const userProfile: UserProfile = {
    name: user.name,
    email: user.email,
    walletAddress: user.walletAddress,
    joinDate: user.joinDate,
    totalOrders: user.totalOrders || 0,
    totalSpent: user.totalSpent || '0 ETH'
  };



  const handleSaveProfile = async () => {
    try {
      await updateUser({
        name: editForm.name,
        email: editForm.email
      });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account and view your order history</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">{userProfile.name}</h3>
                <p className="text-sm text-gray-600">{userProfile.email}</p>
              </div>
              
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'profile' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'orders' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Order History
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'settings' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Profile Information</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{userProfile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{userProfile.email}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wallet Address
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-900 font-mono text-sm bg-gray-100 px-3 py-2 rounded-lg flex-1">
                        {userProfile.walletAddress}
                      </p>
                      <button 
                        onClick={() => navigator.clipboard.writeText(userProfile.walletAddress)}
                        className="text-blue-600 hover:text-blue-700 p-2"
                        title="Copy to clipboard"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 flex space-x-4">
                    <button
                      onClick={handleSaveProfile}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Stats */}
                <div className="mt-8 grid md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800">Member Since</h3>
                    <p className="text-lg font-semibold text-blue-900">{formatDate(userProfile.joinDate)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-800">Total Orders</h3>
                    <p className="text-lg font-semibold text-green-900">{userProfile.totalOrders}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-800">Total Spent</h3>
                    <p className="text-lg font-semibold text-purple-900">{userProfile.totalSpent}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Order History</h2>
                
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">Order {order.id}</h3>
                          <p className="text-sm text-gray-600">{formatDate(order.date)}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <p className="text-lg font-semibold text-blue-600 mt-1">{order.total}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.name} × {item.quantity}</span>
                            <span className="text-gray-900">{item.price}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200 flex space-x-3">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View Details
                        </button>
                        {order.status === 'delivered' && (
                          <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                            Leave Review
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
                
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium mb-4">Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-3 text-gray-700">Email notifications for order updates</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-3 text-gray-700">Marketing emails and promotions</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-3 text-gray-700">SMS notifications</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium mb-4">Privacy</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-3 text-gray-700">Make my profile public</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-3 text-gray-700">Allow others to see my purchase history</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4 text-red-600">Danger Zone</h3>
                    <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                      Delete Account
                    </button>
                    <p className="text-sm text-gray-600 mt-2">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}