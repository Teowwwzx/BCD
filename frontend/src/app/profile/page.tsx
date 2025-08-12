'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useOrders } from '../../hooks/useOrders';
import type { Order } from '../../types';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const userId = user ? user.id : null;
  const { profile, profileLoading } = useProfile(userId);
  const { orders, loading: ordersLoading, error: ordersError } = useOrders(userId);

  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [authLoading, user, router]);
  
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#0d0221] flex items-center justify-center">
        <div className="font-pixel text-lg text-white animate-pulse">LOADING_USER_DATA...</div>
      </div>
    );
  }
  
  // If there's no user, render nothing while the redirect is happening.
  if (!user) {
    return null;
  }
  if (ordersError) {
    return (
      <div className="min-h-screen bg-[#0d0221] flex items-center justify-center">
        <div className="font-pixel text-lg text-white animate-pulse">ERROR_LOADING_ORDERS: {ordersError}</div>
      </div>
    );
  }


  const handleBecomeSeller = async () => {
    if (!profile) return;
    if (confirm('Are you sure you want to become a seller?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${profile.id}/upgrade-to-seller`, {
          method: 'PUT',
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        alert('Congratulations! You are now a seller. Redirecting you to your dashboard...');
        router.push('/dashboard');
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#0d0221] text-gray-300 font-mono-pixel">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="font-pixel text-4xl text-white">USER_PROFILE</h1>
          <p className="mt-2 text-lg text-[#00f5c3]">WELCOME, {profile?.username.toUpperCase()}</p>
        </div>

        {/* Main Content Area */}
        <div className="p-1 bg-gradient-to-br from-[#30214f] to-[#0d0221]">
          <div className="bg-[#0d0221] p-6 min-h-[400px] space-y-8">

            {/* --- Profile Information Section --- */}
            <div>
              <h2 className="font-pixel text-xl text-white mb-6">// PROFILE_INFORMATION</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">USERNAME</label>
                  <p className="text-lg text-white p-2 border-2 border-dashed border-[#30214f]">{profile?.username}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">EMAIL</label>
                  <p className="text-lg text-white p-2 border-2 border-dashed border-[#30214f]">{profile?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">CREATED_AT</label>
                  <p className="text-lg text-white p-2 border-2 border-dashed border-[#30214f]">{(profile?.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">UPDATED_AT</label>
                  <p className="text-lg text-white p-2 border-2 border-dashed border-[#30214f]">{(profile?.updatedAt)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">USER_ROLE</label>
                  <p className="text-lg text-white p-2 border-2 border-dashed border-[#30214f]">{profile?.user_role}</p>
                </div>
              </div>

              {/*_ The "Become a Seller" button, which uses the 'profile' object */}
              {profile?.user_role === 'buyer' && (
                <div className="mt-8 pt-6 border-t-2 border-dashed border-[#30214f]">
                  <h3 className="text-lg text-white font-pixel mb-4">Seller Account</h3>
                  <button onClick={handleBecomeSeller} className="font-pixel text-sm text-black bg-[#00f5c3] px-4 py-2 hover:bg-white">
                    [ UPGRADE_TO_SELLER ]
                  </button>
                </div>
              )}
            </div>

            {/* --- Order History Section --- */}
            {profile?.user_role != 'admin' && (

            <div>
              <h2 className="font-pixel text-xl text-white mb-6">// ORDER_HISTORY</h2>
              <div className="space-y-4">
                {/*_ Using the 'orders' array from your useOrders hook */}
                {ordersLoading ? (
                  <p className="animate-pulse">LOADING_ORDERS...</p>
                ) : orders.length > 0 ? orders.map((order: Order) => (
                  <div key={order.id} className="p-4 border-2 border-[#30214f]">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white">ORDER_ID: {order.id}</p>
                        <p className="text-sm text-gray-400">DATE: {formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-pixel text-[#00f5c3]">${(order.totalAmount).toFixed(2)}</p>
                        <p className="text-xs text-yellow-400">{order.order_status?.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                )) : (
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