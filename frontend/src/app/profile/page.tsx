// src/app/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import type { Order, User } from '../../types';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Modal from '../../components/Modal'; // Import the Modal component
import OrderTracker from '../../components/OrderTracker';
import WalletInfo from '../../components/WalletInfo';

export default function ProfilePage() {
  // --- 1. HOOKS ---
  const { user, authIsLoading } = useAuth();
  const router = useRouter();

  // The useProfile hook now returns an update function
  const { profile, orders, profileLoading, error, updateProfile } = useProfile(user?.id || null);

  // --- 2. LOCAL STATE for UI ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    f_name: '',
    l_name: '',
    phone: '',
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // --- 3. EFFECTS ---
  useEffect(() => {
    if (!authIsLoading && !user) {
      router.push('/auth');
    }
  }, [authIsLoading, user, router]);

  // Sync form data when profile loads or when editing starts
  useEffect(() => {
    if (profile) {
      setFormData({
        f_name: profile.f_name || '',
        l_name: profile.l_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  // --- 4. GUARD CLAUSES ---
  if (authIsLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#0d0221] flex items-center justify-center">
        <div className="font-pixel text-lg text-white animate-pulse">LOADING_USER_DATA...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // Render nothing while redirecting
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d0221] flex items-center justify-center">
        <div className="font-pixel text-lg text-red-500">ERROR: {error}</div>
      </div>
    );
  }

  // --- 5. HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const updatedProfile = await updateProfile(formData);
    if (updatedProfile) {
      alert('Profile updated successfully!');
      setIsEditing(false);
    } else {
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    // Reset form data to the original profile data
    if (profile) {
      setFormData({
        f_name: profile.f_name || '',
        l_name: profile.l_name || '',
        phone: profile.phone || '',
      });
    }
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // --- 6. JSX RENDER ---
  return (
    <div className="min-h-screen bg-[#0d0221] text-gray-300 font-mono-pixel">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="font-pixel text-4xl text-white">USER_PROFILE</h1>
          <p className="mt-2 text-lg text-[#00f5c3]">WELCOME, {profile.username.toUpperCase()}</p>
        </div>

        <div className="p-1 bg-gradient-to-br from-[#30214f] to-[#0d0221]">
          <div className="bg-[#0d0221] p-6 min-h-[400px] space-y-8">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-pixel text-xl text-white">// PROFILE_INFORMATION</h2>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="font-pixel text-sm text-black bg-[#00f5c3] px-4 py-2 hover:bg-white">
                    [ EDIT_PROFILE ]
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Non-editable fields */}
                <div>
                  <label className="text-sm text-gray-400">USERNAME</label>
                  <p className="text-lg text-white mt-1">{profile.username}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">EMAIL</label>
                  <p className="text-lg text-white mt-1">{profile.email}</p>
                </div>

                {/* Editable Fields */}
                <div>
                  <label className="text-sm text-gray-400">FIRST_NAME</label>
                  {isEditing ? (
                    <input name="f_name" value={formData.f_name} onChange={handleInputChange} className="w-full mt-1 p-2 bg-black border-2 border-[#30214f] text-white focus:border-[#00f5c3] focus:outline-none" />
                  ) : (
                    <p className="text-lg text-white mt-1">{profile.f_name || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-400">LAST_NAME</label>
                  {isEditing ? (
                    <input name="l_name" value={formData.l_name} onChange={handleInputChange} className="w-full mt-1 p-2 bg-black border-2 border-[#30214f] text-white focus:border-[#00f5c3] focus:outline-none" />
                  ) : (
                    <p className="text-lg text-white mt-1">{profile.l_name || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-400">PHONE</label>
                  {isEditing ? (
                    <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full mt-1 p-2 bg-black border-2 border-[#30214f] text-white focus:border-[#00f5c3] focus:outline-none" />
                  ) : (
                    <p className="text-lg text-white mt-1">{profile.phone || 'N/A'}</p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-6 flex space-x-4">
                  <button onClick={handleSave} disabled={profileLoading} className="font-pixel text-sm text-black bg-green-500 px-4 py-2 hover:bg-green-400 disabled:opacity-50">
                    [ SAVE_CHANGES ]
                  </button>
                  <button onClick={handleCancel} className="font-pixel text-sm text-white bg-red-600 px-4 py-2 hover:bg-red-500">
                    [ CANCEL ]
                  </button>
                </div>
              )}
            </div>

            {/* WALLET INFORMATION SECTION */}
            <div>
              <h2 className="font-pixel text-xl text-white mb-6">// WALLET_INFORMATION</h2>
              <WalletInfo className="bg-[#1a1a2e] border-2 border-[#30214f] hover:border-[#00f5c3] transition-colors" />
            </div>

            {/* Order History Section (No changes needed here) */}
            {profile.user_role !== 'admin' && (
              <div>
                <h2 className="font-pixel text-xl text-white mb-6">// ORDER_HISTORY</h2>
                <div className="space-y-4">
                  {orders.length > 0 ? (
                    orders.map((order: Order) => (
                      <div
                        key={order.id}
                        className="p-4 border-2 border-[#30214f] hover:border-[#00f5c3] cursor-pointer transition-colors"
                        onClick={() => setSelectedOrder(order)} // Set the selected order on click
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white">ORDER_ID: {order.uuid.substring(0, 8)}</p>
                            <p className="text-sm text-gray-400">DATE: {formatDate(order.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-pixel text-[#00f5c3]">${(Number(order.totalAmount) || 0).toFixed(2)}</p>
                            <p className="text-xs text-yellow-400">{order.order_status?.toUpperCase()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>NO_ORDERS_FOUND</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}