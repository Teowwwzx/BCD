// src/components/OrderSummary.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { CartItem, OrderCalculation } from '../types';
import { useToasts } from '../contexts/ToastContext';

// 1. Props are updated: onCouponApply is replaced with onSelectCouponClick
interface OrderSummaryProps {
  cartItems: CartItem[];
  shippingCost?: number;
  selectedShippingMethodName?: string;
  couponCode?: string;
  couponDiscount?: number;
  taxRate?: number;
  onSelectCouponClick: () => void; // Prop to open the modal
  onCouponRemove?: () => void;
  showCouponToast?: boolean; // Flag to show toast when coupon is applied
  isLoading?: boolean;
  className?: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  cartItems,
  shippingCost = 0,
  selectedShippingMethodName,
  couponCode,
  couponDiscount = 0,
  taxRate = 0.1, // 10% default tax rate
  onSelectCouponClick,
  onCouponRemove,
  isLoading = false,
  className = '',
  showCouponToast = false,
}) => {
  // 2. Internal state for the input is no longer needed.
  // The component now only displays state managed by the parent page.

  const orderCalculation = useMemo<OrderCalculation>(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const discountAmount = couponDiscount;
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = subtotalAfterDiscount * taxRate;
    const totalAmount = subtotalAfterDiscount + taxAmount + shippingCost;
    
    return { subtotal, discountAmount, taxAmount, shippingAmount: shippingCost, totalAmount };
  }, [cartItems, couponDiscount, taxRate, shippingCost]);

  const { addToast } = useToasts();
  
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }, []);
  // Show toast notification when coupon is applied
  React.useEffect(() => {
    if (showCouponToast && couponCode && couponDiscount > 0) {
      addToast(`Coupon "${couponCode}" applied! You saved ${formatCurrency(couponDiscount)}`, 'success');
    }
  }, [showCouponToast, couponCode, couponDiscount, formatCurrency, addToast]);


  return (
    <div className={`order-summary bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Order Summary
      </h3>
      
      {/* Cart Items */}
      <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
        {cartItems.map((item) => (
          <div key={item.productId} className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">{item.product.name}</h4>
              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
              {formatCurrency(item.product.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>
      
      {/* 3. The input field is replaced with a "Select Coupon" button */}
      <div className="mb-6">
        {couponCode && couponDiscount > 0 ? (
          <div className="flex items-center justify-between rounded-md bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 p-3">
            <div className="flex items-center space-x-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span className="text-sm font-medium text-green-800 dark:text-green-300">{couponCode}</span>
            </div>
            <button
              onClick={() => {
                onCouponRemove?.();
                addToast('Coupon removed', 'success');
              }}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 underline"
              disabled={isLoading}
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={onSelectCouponClick} // This prop opens the modal on the parent page
            className="w-full text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium py-2 rounded-md bg-blue-500/10 hover:bg-blue-500/20"
            disabled={isLoading}
          >
            Select a Coupon
          </button>
        )}
      </div>
      
      {/* Order Totals */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Subtotal</span><span className="text-gray-900 dark:text-gray-200">{formatCurrency(orderCalculation.subtotal)}</span></div>
        
        <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Shipping</span><span className="text-gray-900 dark:text-gray-200">{shippingCost > 0 ? formatCurrency(shippingCost) : 'Free'}</span></div>
        
        {couponDiscount > 0 && (
          <div className="flex justify-between text-sm"><span className="text-green-600 dark:text-green-400">Coupon Discount ({couponCode})</span><span className="text-green-600 dark:text-green-400">-{formatCurrency(orderCalculation.discountAmount)}</span></div>
        )}
        <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Tax ({Math.round(taxRate * 100)}%)</span><span className="text-gray-900 dark:text-gray-200">{formatCurrency(orderCalculation.taxAmount)}</span></div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
          <div className="flex justify-between"><span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span><span className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(orderCalculation.totalAmount)}</span></div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;