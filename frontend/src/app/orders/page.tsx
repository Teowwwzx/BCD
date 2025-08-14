'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useOrders } from '../../hooks/useOrders';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import type { Order } from '../../types';

interface OrderCardProps {
  order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-400';
      case 'confirmed':
      case 'processing':
        return 'text-blue-400';
      case 'shipped':
        return 'text-purple-400';
      case 'delivered':
        return 'text-green-400';
      case 'cancelled':
      case 'refunded':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-700 p-6 rounded-lg mb-4 hover:bg-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Order #{order.id}
          </h3>
          <p className="text-sm text-gray-400">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${getStatusColor(order.order_status)}`}>
            {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
          </p>
          <p className="text-lg font-bold text-white">
            ${Number(order.totalAmount).toFixed(2)}
          </p>
        </div>
      </div>
      
      {order.orderItems && order.orderItems.length > 0 && (
        <div className="border-t border-gray-600 pt-4">
          <p className="text-sm text-gray-400 mb-2">
            {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {order.orderItems.slice(0, 3).map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-300">
                  {item.product_name} × {item.quantity}
                </span>
                <span className="text-gray-400">
                  ${Number(item.totalPrice).toFixed(2)}
                </span>
              </div>
            ))}
            {order.orderItems.length > 3 && (
              <p className="text-xs text-gray-500">
                +{order.orderItems.length - 3} more items
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    <span className="ml-3 text-gray-400">Loading your orders...</span>
  </div>
);

const ErrorMessage: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
    <p className="text-red-400 mb-4">{error}</p>
    <button
      onClick={onRetry}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
    >
      Try Again
    </button>
  </div>
);

export default function OrdersPage() {
  // 1. State Hooks
  // (none in this component)
  
  // 2. Context Hooks
  const { user, isLoggedIn, authIsLoading } = useAuth();
  const { orders, ordersIsLoading, ordersError, refetchOrders } = useOrders(user?.id || null);
  
  // 3. Effect Hooks
  const router = useRouter();
  
  useEffect(() => {
    if (!authIsLoading && !isLoggedIn) {
      router.push('/auth');
    }
  }, [authIsLoading, isLoggedIn, router]);

  // Show loading state while checking authentication
  if (authIsLoading) {
    return (
      <div className="bg-gray-900 min-h-screen">
        <Header />
        <LoadingSpinner />
        <Footer />
      </div>
    );
  }

  // Don't render anything if redirecting
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="bg-gray-900 min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">My Orders</h1>
          {orders.length > 0 && (
            <button
              onClick={refetchOrders}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              disabled={ordersIsLoading}
            >
              {ordersIsLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          {ordersIsLoading ? (
            <LoadingSpinner />
          ) : ordersError ? (
            <ErrorMessage error={ordersError} onRetry={refetchOrders} />
          ) : orders.length > 0 ? (
            <div>
              <p className="text-gray-400 mb-6">
                You have {orders.length} order{orders.length > 1 ? 's' : ''}
              </p>
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl text-gray-600 mb-4">📦</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No orders yet
              </h3>
              <p className="text-gray-400 mb-6">
                When you place your first order, it will appear here.
              </p>
              <button
                onClick={() => router.push('/products')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Start Shopping
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}