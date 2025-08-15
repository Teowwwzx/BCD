'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { CartItem, OrderCalculation } from '../types';

interface OrderSummaryProps {
  cartItems: CartItem[];
  shippingCost?: number;
  selectedShippingMethodName?: string;
  couponCode?: string;
  couponDiscount?: number;
  taxRate?: number;
  onCouponApply?: (code: string) => Promise<{ discount: number; error?: string }>;
  onCouponRemove?: () => void;
  isLoading?: boolean;
  className?: string;
}

interface CouponState {
  code: string;
  isApplying: boolean;
  error: string | null;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  cartItems,
  shippingCost = 0,
  selectedShippingMethodName,
  couponCode,
  couponDiscount = 0,
  taxRate = 0.1, // 10% default tax rate
  onCouponApply,
  onCouponRemove,
  isLoading = false,
  className = '',
}) => {
  // 1. State Hooks
  const [couponState, setCouponState] = useState<CouponState>({
    code: couponCode || '',
    isApplying: false,
    error: null,
  });

  // 4. Performance Hooks
  const orderCalculation = useMemo<OrderCalculation>(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const discountAmount = couponDiscount;
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = subtotalAfterDiscount * taxRate;
    const totalAmount = subtotalAfterDiscount + taxAmount + shippingCost;
    
    return {
      subtotal,
      discountAmount,
      taxAmount,
      shippingAmount: shippingCost,
      totalAmount,
    };
  }, [cartItems, couponDiscount, taxRate, shippingCost]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  const handleCouponInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCouponState(prev => ({ ...prev, code: value, error: null }));
  }, []);

  const handleCouponApply = useCallback(async () => {
    if (!onCouponApply || !couponState.code.trim()) return;
    
    setCouponState(prev => ({ ...prev, isApplying: true, error: null }));
    
    try {
      const result = await onCouponApply(couponState.code.trim());
      
      if (result.error) {
        setCouponState(prev => ({ ...prev, error: result.error!, isApplying: false }));
      } else {
        setCouponState(prev => ({ ...prev, isApplying: false, error: null }));
      }
    } catch (error) {
      setCouponState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to apply coupon',
        isApplying: false,
      }));
    }
  }, [couponState.code, onCouponApply]);

  const handleCouponRemove = useCallback(() => {
    if (onCouponRemove) {
      onCouponRemove();
    }
    setCouponState({ code: '', isApplying: false, error: null });
  }, [onCouponRemove]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCouponApply();
    }
  }, [handleCouponApply]);

  return (
    <div className={`order-summary bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Order Summary
      </h3>
      
      {/* Cart Items */}
      <div className="space-y-3 mb-6">
        {cartItems.map((item) => (
          <div key={`${item.productId}-${item.id || 'default'}`} className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {item.product.name}
              </h4>
              <p className="text-xs text-gray-500">
                Qty: {item.quantity} × {formatCurrency(item.product.price)}
              </p>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {formatCurrency(item.product.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>
      
      {/* Coupon Section */}
      {onCouponApply && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Coupon Code
          </h4>
          
          {couponCode && couponDiscount > 0 ? (
            <div className="flex items-center justify-between rounded-md bg-green-50 border border-green-200 p-3">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm font-medium text-green-800">
                  {couponCode}
                </span>
                <span className="text-sm text-green-600">
                  (-{formatCurrency(couponDiscount)})
                </span>
              </div>
              <button
                onClick={handleCouponRemove}
                className="text-sm text-green-600 hover:text-green-800 underline"
                disabled={isLoading}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={couponState.code}
                  onChange={handleCouponInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter coupon code"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading || couponState.isApplying}
                />
                <button
                  onClick={handleCouponApply}
                  disabled={isLoading || couponState.isApplying || !couponState.code.trim()}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {couponState.isApplying ? 'Applying...' : 'Apply'}
                </button>
              </div>
              
              {couponState.error && (
                <p className="text-sm text-red-600">
                  {couponState.error}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Order Totals */}
      <div className="space-y-3 border-t border-gray-200 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">
            {formatCurrency(orderCalculation.subtotal)}
          </span>
        </div>
        
        {couponDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Discount</span>
            <span className="text-green-600">
              -{formatCurrency(orderCalculation.discountAmount)}
            </span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Shipping
            {selectedShippingMethodName && (
              <span className="text-xs text-gray-500 block">
                via {selectedShippingMethodName}
              </span>
            )}
          </span>
          <span className="text-gray-900">
            {shippingCost > 0 ? formatCurrency(shippingCost) : 'Free'}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Tax ({Math.round(taxRate * 100)}%)
          </span>
          <span className="text-gray-900">
            {formatCurrency(orderCalculation.taxAmount)}
          </span>
        </div>
        
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(orderCalculation.totalAmount)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Savings Summary */}
      {couponDiscount > 0 && (
        <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-3">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">🎉</span>
            <span className="text-sm font-medium text-green-800">
              You saved {formatCurrency(couponDiscount)} with your coupon!
            </span>
          </div>
        </div>
      )}
      
      {/* Order Details */}
      <div className="mt-6 text-xs text-gray-500 space-y-1">
        <p>• All prices include applicable taxes</p>
        <p>• Shipping costs are calculated based on your location</p>
        <p>• Final total will be charged at checkout</p>
        {cartItems.length > 0 && (
          <p>• Total items: {cartItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;