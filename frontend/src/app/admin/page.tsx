// frontend/src/app/admin/page.tsx
'use client';

import React from 'react';
import { useAdminStats } from '../../hooks/useAdminStats';

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: string }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
    <div className="flex items-center">
      <div className="text-3xl mr-4">{icon}</div>
      <div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
    </div>
  </div>
);

export default function AdminDashboardPage() {
  const { stats, loading, error } = useAdminStats();

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon="👥" />
        <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon="📦" />
        <StatCard title="Total Orders" value={stats?.totalOrders ?? 0} icon="🛒" />
        <StatCard title="Total Revenue" value={`$${stats?.totalRevenue.toFixed(2) ?? '0.00'}`} icon="💰" />
      </div>

      {/* We can add Chart and Table components here next */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-4 dark:text-white">Recent Orders</h3>
            {/* Placeholder for recent orders table */}
            <p className="text-gray-500">Recent orders will be displayed here.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-4 dark:text-white">Top Products</h3>
             {/* Placeholder for top products table */}
            <p className="text-gray-500">Top selling products will be displayed here.</p>
          </div>
      </div>
    </div>
  );
}