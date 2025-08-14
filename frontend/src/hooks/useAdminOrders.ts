import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Order, OrderStatus, PaymentStatus } from '../types/index';

interface OrderFilters {
  search?: string;
  orderStatus?: OrderStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
  buyerId?: number;
  limit?: number;
  offset?: number;
}

export const useAdminOrders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchOrders = useCallback(async (filters: OrderFilters = {}) => {
    if (!token) {
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.orderStatus && filters.orderStatus !== 'all') params.append('order_status', filters.orderStatus);
      if (filters.paymentStatus && filters.paymentStatus !== 'all') params.append('payment_status', filters.paymentStatus);
      if (filters.buyerId) params.append('buyer_id', filters.buyerId.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/orders${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const result = await response.json();
      if (result.success) {
        setOrders(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  const getOrderById = useCallback(async (orderId: number): Promise<Order | null> => {
    if (!token) return null;
    
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch order details');
      
      const result = await response.json();
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      return null;
    }
  }, [token, API_BASE_URL]);

  const updateOrderStatus = useCallback(async (orderId: number, orderStatus?: OrderStatus, paymentStatus?: PaymentStatus) => {
    if (!token) {
      console.error('No token available for order status update');
      return false;
    }
    
    setActionLoading(true);
    setError(null);
    
    try {
      const updateData: any = {};
      if (orderStatus) updateData.order_status = orderStatus;
      if (paymentStatus) updateData.payment_status = paymentStatus;
      
      console.log('Updating order status:', { orderId, updateData });
      
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      
      const result = await response.json();
      console.log('Update order response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: Failed to update order status`);
      }
      
      if (result.success) {
        // Update the local orders state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, ...updateData }
              : order
          )
        );
        // Refresh orders to get the latest data
        fetchOrders();
        return true;
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message);
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [token, API_BASE_URL]);

  const initiateRefund = useCallback(async (orderId: number) => {
    if (!token) return false;
    
    setActionLoading(true);
    try {
      // First update the order status to refunded
      const success = await updateOrderStatus(orderId, 'refunded' as OrderStatus, 'refunded' as PaymentStatus);
      
      if (success) {
        // Here you would integrate with the RefundContract
        // For now, we'll just update the status
        console.log(`Refund initiated for order ${orderId}`);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [token, updateOrderStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { 
    orders, 
    loading, 
    error, 
    actionLoading,
    fetchOrders, 
    getOrderById,
    updateOrderStatus,
    initiateRefund,
    refetch: fetchOrders 
  };
};