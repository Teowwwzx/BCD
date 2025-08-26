'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useShippingMethods, ShippingCostResult } from '../hooks/useShippingMethods';
import { ShippingMethod } from '../types';

interface ShippingMethodSelectorProps {
  selectedMethodId: number | null;
  onMethodSelect: (methodId: number, cost: number) => void;
  weight?: number;
  distance?: number;
  destinationPostcode?: string;
  disabled?: boolean;
  className?: string;
}



export const ShippingMethodSelector: React.FC<ShippingMethodSelectorProps> = ({
  selectedMethodId,
  onMethodSelect,
  weight = 1,
  distance = 10,
  destinationPostcode,
  disabled = false,
  className = '',
}) => {
  // 1. State Hooks
  const [shippingOptions, setShippingOptions] = useState<ShippingCostResult[]>([]);
  const [hoveredMethodId, setHoveredMethodId] = useState<number | null>(null);

  // 2. Context Hooks
  const {
    shippingMethods,
    shippingIsLoading,
    shippingError,
    fetchShippingMethods,
    calculateAllShippingCosts,
    clearShippingError,
  } = useShippingMethods();

  // 3. Effect Hooks
  useEffect(() => {
    fetchShippingMethods();
  }, [fetchShippingMethods]);

  useEffect(() => {
    const calculateCosts = async () => {
      if (shippingMethods.length === 0) return;
      
      console.log('🚚 Starting shipping cost calculation');
      console.log('📦 Input params:', { weight, distance, destinationPostcode });
      console.log('🏪 Available shipping methods:', shippingMethods);
      
      try {
        const calculations = await calculateAllShippingCosts({
          weight,
          distance,
          destinationPostcode,
        });
        
        // console.log('💰 Raw calculations from API:', calculations);
        
        // Use the calculations directly since they already have the correct structure
        setShippingOptions(calculations);
        
        // console.log('✅ Final shipping options set:', calculations);

      } catch (error) {
        console.error('❌ Failed to calculate shipping costs:', error);
      }
    };
    
    calculateCosts();
  }, [shippingMethods, weight, distance, destinationPostcode, calculateAllShippingCosts]);

  // Performance Hooks
  const sortedShippingOptions = useMemo(() => {
    console.log('🔄 Sorting shipping options:', shippingOptions);
    const sorted = shippingOptions.sort((a, b) => a.totalCost - b.totalCost);
    console.log('📊 Sorted shipping options:', sorted);
    return sorted;
  }, [shippingOptions]);

  const handleMethodSelect = useCallback((methodId: number, cost: number) => {
    if (!disabled) {
      onMethodSelect(methodId, cost);
    }
  }, [disabled, onMethodSelect]);

  const handleMouseEnter = useCallback((methodId: number) => {
    setHoveredMethodId(methodId);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredMethodId(null);
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    // console.log('💰 formatCurrency called with amount:', amount, 'type:', typeof amount);
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
    // console.log('💰 formatCurrency returning:', formatted);
    return formatted;
  }, []);

  const getShippingIcon = useCallback((methodName: string) => {
    const name = methodName.toLowerCase();
    if (name.includes('express') || name.includes('overnight')) return '⚡';
    if (name.includes('standard') || name.includes('regular')) return '📦';
    if (name.includes('economy') || name.includes('slow')) return '🐌';
    if (name.includes('priority')) return '🚀';
    return '🚚';
  }, []);

  if (shippingIsLoading) {
    return (
      <div className={`shipping-method-selector ${className}`}>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Choose Shipping Method
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-6 rounded bg-gray-300"></div>
                  <div className="h-4 w-32 rounded bg-gray-300"></div>
                </div>
                <div className="h-4 w-16 rounded bg-gray-300"></div>
              </div>
              <div className="mt-2 h-3 w-48 rounded bg-gray-300"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (shippingError) {
    return (
      <div className={`shipping-method-selector ${className}`}>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Choose Shipping Method
        </h3>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <p className="text-red-700">{shippingError}</p>
          </div>
          <button
            onClick={clearShippingError}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`shipping-method-selector ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Choose Shipping Method
      </h3>
      
      {sortedShippingOptions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
          <p className="text-gray-600">No shipping methods available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedShippingOptions.map((option) => {
            const method = shippingMethods.find(m => m.id === option.methodId);
            if (!method) return null;
            
            const isSelected = selectedMethodId === option.methodId;
            const isHovered = hoveredMethodId === option.methodId;
            const isCheapest = option.totalCost === Math.min(...sortedShippingOptions.map(o => o.totalCost));
            const isFastest = option.estimatedDays === Math.min(...sortedShippingOptions.map(o => parseInt(o.estimatedDays.split('-')[0]))).toString() + (option.estimatedDays.includes('-') ? '-' + Math.min(...sortedShippingOptions.map(o => parseInt(o.estimatedDays.split('-')[1] || o.estimatedDays.split('-')[0]))) : '') + ' days';
            
            return (
              <div
                key={option.methodId}
                className={`
                  shipping-option relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
                  ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : isHovered
                      ? 'border-gray-300 bg-gray-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                  ${
                    disabled
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:shadow-sm'
                  }
                `}
                onClick={() => handleMethodSelect(option.methodId, option.totalCost)}
                onMouseEnter={() => handleMouseEnter(option.methodId)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Badges */}
                <div className="absolute top-2 right-2 flex space-x-1">
                  {isCheapest && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      Cheapest
                    </span>
                  )}
                  {isFastest && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      Fastest
                    </span>
                  )}
                </div>

                {/* Selection indicator */}
                <div className="absolute bottom-4 right-4">
                  <div
                    className={`
                      h-5 w-5 rounded-full border-2 transition-all duration-200
                      ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 bg-white'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping method content */}
                <div className="flex items-start justify-between pr-8">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">
                      {getShippingIcon(option.methodName)}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">
                        {option.methodName}
                      </h4>
                      
                      {method.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {method.description}
                        </p>
                      )}
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <span>📅</span>
                          <span>{option.estimatedDays}</span>
                        </div>
                        
                        {method.trackingAvailable && (
                          <div className="flex items-center space-x-1">
                            <span>📍</span>
                            <span>Tracking included</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {(() => {
                        console.log(`💲 Displaying price for ${option.methodName}:`, {
                          totalCost: option.totalCost,
                          baseCost: option.baseCost,
                          weightCost: option.weightCost,
                          distanceCost: option.distanceCost,
                          fullOption: option
                        });
                        return formatCurrency(option.totalCost);
                      })()}
                    </div>
                  </div>
                </div>

                {/* Cost breakdown for selected method */}
                {isSelected && (
                  <div className="mt-4 rounded-md bg-blue-100 p-3">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">
                      Cost Breakdown
                    </h5>
                    <div className="space-y-1 text-sm text-blue-800">
                      <div className="flex justify-between">
                        <span>Base cost:</span>
                        <span>{formatCurrency(option.baseCost)}</span>
                      </div>
                      {option.weightCost > 0 && (
                        <div className="flex justify-between">
                          <span>Weight cost ({weight} kg):</span>
                          <span>{formatCurrency(option.weightCost)}</span>
                        </div>
                      )}
                      {option.distanceCost > 0 && (
                        <div className="flex justify-between">
                          <span>Distance cost ({distance} km):</span>
                          <span>{formatCurrency(option.distanceCost)}</span>
                        </div>
                      )}
                      <div className="border-t border-blue-200 pt-1 flex justify-between font-medium">
                        <span>Total:</span>
                        <span>{formatCurrency(option.totalCost)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Shipping info */}
      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Shipping Information
        </h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• All shipping times are business days and exclude weekends</p>
          <p>• Tracking information will be provided once your order ships</p>
          <p>• Shipping costs are calculated based on weight and distance</p>
          <p>• Free shipping may be available for orders over certain amounts</p>
        </div>
      </div>
    </div>
  );
};

export default ShippingMethodSelector;