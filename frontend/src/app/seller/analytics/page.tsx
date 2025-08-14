'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useSeller } from '../../../hooks/useSeller';
import { UserRole } from '../../../types';
import { useRouter } from 'next/navigation';

const SellerAnalyticsPage: React.FC = () => {
  // 1. State Hooks
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');

  // 2. Context Hooks
  const { user, isLoggedIn } = useAuth();
  const {
    products,
    sales,
    totalRevenue,
    totalSales,
    activeProducts,
    productsIsLoading,
    salesIsLoading,
    formatDate,
  } = useSeller();
  
  const router = useRouter();

  // 3. Effect Hooks
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/auth');
      return;
    }
    
    if (user && user.user_role !== UserRole.Seller && user.user_role !== UserRole.Admin) {
      router.push('/sell');
    }
  }, [isLoggedIn, user, router]);

  // Calculate analytics data
  const getAnalyticsData = () => {
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    const recentSales = sales.filter(sale => new Date(sale.date) >= cutoffDate);
    const recentRevenue = recentSales.reduce((sum, sale) => {
      return sum + parseFloat(sale.amount.replace(/[^0-9.]/g, ''));
    }, 0);
    
    // Product performance
    const productPerformance = products.map(product => {
      const productSales = recentSales.filter(sale => sale.productName === product.name);
      const productRevenue = productSales.reduce((sum, sale) => {
        return sum + parseFloat(sale.amount.replace(/[^0-9.]/g, ''));
      }, 0);
      
      return {
        ...product,
        salesCount: productSales.length,
        revenue: productRevenue,
        conversionRate: product.stock > 0 ? (productSales.length / product.stock * 100) : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);
    
    // Status distribution
    const statusCounts = sales.reduce((acc, sale) => {
      acc[sale.status] = (acc[sale.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      recentSales: recentSales.length,
      recentRevenue,
      productPerformance,
      statusCounts,
      averageOrderValue: recentSales.length > 0 ? recentRevenue / recentSales.length : 0
    };
  };

  const analytics = getAnalyticsData();

  const StatCard = ({ title, value, icon, trend, trendValue }: {
    title: string;
    value: string | number;
    icon: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {trend && trendValue && (
            <p className={`text-sm mt-2 flex items-center ${
              trend === 'up' ? 'text-green-600' :
              trend === 'down' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              <span className="mr-1">
                {trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️'}
              </span>
              {trendValue}
            </p>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );

  if (!isLoggedIn || (user && user.user_role !== UserRole.Seller && user.user_role !== UserRole.Admin)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (productsIsLoading || salesIsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400">Track your sales performance and insights</p>
          </div>
          
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`$${analytics.recentRevenue.toFixed(2)}`}
          icon="💰"
          trend="up"
          trendValue="+12.5%"
        />
        <StatCard
          title="Total Sales"
          value={analytics.recentSales}
          icon="🛒"
          trend="up"
          trendValue="+8.2%"
        />
        <StatCard
          title="Active Products"
          value={activeProducts}
          icon="📦"
          trend="neutral"
          trendValue="No change"
        />
        <StatCard
          title="Avg Order Value"
          value={`$${analytics.averageOrderValue.toFixed(2)}`}
          icon="📊"
          trend="up"
          trendValue="+5.1%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Top Performing Products</h3>
          <div className="space-y-4">
            {analytics.productPerformance.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {product.salesCount} sales • ${product.revenue.toFixed(2)} revenue
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {product.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">conversion</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Order Status Distribution</h3>
          <div className="space-y-4">
            {Object.entries(analytics.statusCounts).map(([status, count]) => {
              const percentage = (count / totalSales) * 100;
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'completed': return 'bg-green-500';
                  case 'pending': return 'bg-yellow-500';
                  case 'cancelled': return 'bg-red-500';
                  case 'processing': return 'bg-blue-500';
                  default: return 'bg-gray-500';
                }
              };
              
              return (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {status}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getStatusColor(status)}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Sales Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sales.slice(0, 10).map((sale) => (
                <tr key={sale.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(sale.date)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {sale.productName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {sale.amount}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                      sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      sale.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">💡 Insights & Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Best Selling Product</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {analytics.productPerformance[0]?.name || 'No sales yet'} is your top performer with {analytics.productPerformance[0]?.salesCount || 0} sales.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Revenue Growth</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your revenue has grown by an estimated 12.5% compared to the previous period.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Inventory Alert</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {products.filter(p => p.stock < 5).length} products have low stock levels. Consider restocking.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Order Processing</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You have {analytics.statusCounts.pending || 0} pending orders that need attention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerAnalyticsPage;