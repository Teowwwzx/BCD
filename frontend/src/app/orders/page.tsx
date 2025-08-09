// frontend/src/app/orders/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext'; // THE FIX: Use the correct hook
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Order } from '../../types';

export default function OrdersPage() {
  // --- THE FIX: Call useAuth() instead of useWallet() ---
  const { user, isLoggedIn, isLoading, token } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Redirect if not logged in after auth check
    if (!isLoading && !isLoggedIn) {
      router.push('/auth');
      return;
    }

    const fetchOrders = async () => {
      if (user && token) {
        try {
          const response = await fetch(`http://localhost:5000/api/orders/user/${user.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const result = await response.json();
          if (result.success) {
            setOrders(result.data);
          } else {
            console.error("Failed to fetch orders:", result.error);
          }
        } catch (error) {
          console.error("Error fetching orders:", error);
        } finally {
          setPageLoading(false);
        }
      }
    };
    
    if (!isLoading && isLoggedIn) {
      fetchOrders();
    }
  }, [user, isLoggedIn, isLoading, token, router]);

  if (isLoading || pageLoading) {
    return <div>Loading your orders...</div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">My Orders</h1>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          {orders.length > 0 ? (
            <ul>
              {orders.map(order => (
                <li key={order.id} className="border-b border-gray-700 py-4">
                  <p className="text-white">Order ID: {order.id}</p>
                  <p className="text-gray-400">Status: {order.order_status}</p>
                  <p className="text-gray-400">Total: ${order.totalAmount.toFixed(2)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">You have no orders yet.</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}