// frontend/src/app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAdminStats } from '../../hooks/useAdminStats';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { useModal } from '../../contexts/ModalContext';
import { useToasts } from '../../contexts/ToastContext';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import Link from 'next/link';

const StatCard = ({ title, value, icon, isAlert }: { 
  title: string, 
  value: string | number, 
  icon: string,
  isAlert?: boolean 
}) => {
  const alertClasses = isAlert && Number(value) > 0 
    ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20" 
    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800";
  
  const valueClasses = isAlert && Number(value) > 0
    ? "text-red-600 dark:text-red-400"
    : "text-gray-800 dark:text-white";

  return (
    <div className={`p-6 rounded-lg shadow-md border ${alertClasses}`}>
      <div className="flex items-center">
        <div className="text-3xl mr-4">{icon}</div>
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold ${valueClasses}`}>{value}</p>
        </div>
      </div>
    </div>
  );
};

const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.Pending: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case OrderStatus.Confirmed: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case OrderStatus.Processing: return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case OrderStatus.Shipped: return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case OrderStatus.Delivered: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case OrderStatus.Cancelled: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case OrderStatus.Refunded: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default function AdminDashboardPage() {
  // 1. State Hooks
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersRequiringAttention, setOrdersRequiringAttention] = useState<Order[]>([]);

  // 2. Context Hooks
  const { stats, loading, error } = useAdminStats();
  const {
    orders,
    loading: ordersLoading,
    fetchOrders,
    updateOrderStatus,
    initiateRefund
  } = useAdminOrders();
  const { showModal } = useModal();
  const { addToast } = useToasts();

  // 3. Effect Hooks
  useEffect(() => {
    // Fetch recent orders for dashboard
    fetchOrders({ limit: 5 });
  }, [fetchOrders]);

  useEffect(() => {
    if (orders.length > 0) {
      setRecentOrders(orders.slice(0, 5));

      // Filter orders requiring attention (pending, failed payments, etc.)
      const attentionOrders = orders.filter(order =>
        order.order_status === OrderStatus.Pending ||
        order.payment_status === PaymentStatus.Failed ||
        (order.payment_status === PaymentStatus.Paid &&
          order.order_status !== OrderStatus.Delivered &&
          order.order_status !== OrderStatus.Cancelled &&
          order.order_status !== OrderStatus.Refunded)
      ).slice(0, 5);

      setOrdersRequiringAttention(attentionOrders);
    }
  }, [orders]);

  const handleQuickRefund = (orderId: number) => {
    showModal({
      title: 'Quick Refund',
      message: `Are you sure you want to initiate a refund for order #${orderId}? This action will update the order status to 'Refunded' and trigger the refund process.`,
      confirmText: 'Initiate Refund',
      confirmButtonColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        const success = await initiateRefund(orderId);
        if (success) {
          addToast('Refund initiated successfully', 'success');
          // Refresh orders
          fetchOrders({ limit: 5 });
        } else {
          addToast('Failed to initiate refund', 'error');
        }
      }
    });
  };

  const handleQuickStatusUpdate = async (orderId: number, newStatus: OrderStatus) => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      addToast('Order status updated successfully', 'success');
      // Refresh orders
      fetchOrders({ limit: 5 });
    } else {
      addToast('Failed to update order status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 text-red-700 dark:text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Dashboard Overview</h1>
      
      {/* Key Metrics Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
             title="Total Sales Volume (TTV)" 
             value={`$${Number(stats?.totalSalesVolume ?? 0).toFixed(2)}`} 
             icon="💎" 
           />
          <StatCard 
            title="New Users This Month" 
            value={stats?.newUsersThisMonth ?? 0} 
            icon="🆕" 
          />
          <StatCard 
            title="Pending Products" 
            value={stats?.pendingProducts ?? 0} 
            icon="⏳" 
          />
          <StatCard 
             title="Open Disputes" 
             value={stats?.openDisputes ?? 0} 
             icon="⚠️" 
             isAlert={true}
           />
        </div>
      </div>

      {/* General Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">General Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon="👥" />
          <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon="📦" />
          <StatCard title="Total Orders" value={stats?.totalOrders ?? 0} icon="🛒" />
          <StatCard title="Total Revenue" value={`$${Number(stats?.totalRevenue ?? 0).toFixed(2)}`} icon="💰" />
        </div>
      </div>

      {/* Order Oversight & Dispute Resolution Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Order Oversight & Dispute Resolution</h2>
          <Link
            href="/admin/orders"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            View All Orders
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders Requiring Attention */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg dark:text-white">Orders Requiring Attention</h3>
              <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">
                {ordersRequiringAttention.length}
              </span>
            </div>

            {ordersLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : ordersRequiringAttention.length > 0 ? (
              <div className="space-y-3">
                {ordersRequiringAttention.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">#{order.uuid || order.id}</span>
                        <OrderStatusBadge status={order.order_status} />
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Buyer: {order.users?.username || 'N/A'} • ${Number(order.totalAmount || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {order.order_status === OrderStatus.Pending && (
                        <button
                          onClick={() => handleQuickStatusUpdate(order.id, 'confirmed' as OrderStatus)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          Confirm
                        </button>
                      )}
                      {order.payment_status === PaymentStatus.Paid &&
                        order.order_status !== OrderStatus.Refunded &&
                        order.order_status !== OrderStatus.Cancelled && (
                          <button
                            onClick={() => handleQuickRefund(order.id)}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          >
                            Refund
                          </button>
                        )}
                      <Link
                        href={`/admin/orders`}
                        className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-green-400 text-4xl mb-2">✅</div>
                <p className="text-gray-500 dark:text-gray-400">No orders requiring immediate attention</p>
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-4 dark:text-white">Recent Orders</h3>

            {ordersLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">#{order.uuid || order.id}</span>
                        <OrderStatusBadge status={order.order_status} />
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Buyer: {order.users?.username || 'N/A'} • ${Number(order.totalAmount || 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Link
                      href={`/admin/orders`}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📦</div>
                <p className="text-gray-500 dark:text-gray-400">No recent orders</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/orders"
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">🛒</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Manage Orders</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">View, update, and resolve order disputes</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/products"
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">📦</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Manage Products</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Review and moderate product listings</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Manage Users</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">View and manage user accounts</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}