import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { ShippingMethod } from '../types';

interface ShippingState {
  shippingMethods: ShippingMethod[];
  shippingIsLoading: boolean;
  shippingError: string | null;
}

interface ShippingCostCalculation {
  shippingMethodId: number;
  weight?: number;
  distance?: number;
  destinationPostcode?: string;
}

interface ShippingCostResult {
  methodId: number;
  methodName: string;
  baseCost: number;
  weightCost: number;
  distanceCost: number;
  totalCost: number;
  estimatedDays: string;
}

export const useShippingMethods = () => {
  // 1. State Hooks
  const [state, setState] = useState<ShippingState>({
    shippingMethods: [],
    shippingIsLoading: false,
    shippingError: null,
  });

  // 2. Context Hooks
  const { token } = useAuth();

  // Helper function to make API calls
  const makeApiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }, [token]);

  // Fetch all active shipping methods
  const fetchShippingMethods = useCallback(async () => {
    setState(prev => ({ ...prev, shippingIsLoading: true, shippingError: null }));
    
    try {
      const response = await makeApiCall('/shipping-methods');
      
      setState(prev => ({
        ...prev,
        shippingMethods: response.data || [],
        shippingIsLoading: false,
      }));
      
      return response.data || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch shipping methods';
      setState(prev => ({
        ...prev,
        shippingError: errorMessage,
        shippingIsLoading: false,
      }));
      throw error;
    }
  }, [makeApiCall]);

  // Get shipping method by ID
  const getShippingMethodById = useCallback(async (methodId: number): Promise<ShippingMethod> => {
    try {
      const data = await makeApiCall(`/shipping-methods/${methodId}`);
      return data.shippingMethod;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch shipping method';
      setState(prev => ({ ...prev, shippingError: errorMessage }));
      throw error;
    }
  }, [makeApiCall]);

  // Calculate shipping cost for a specific method
  const calculateShippingCost = useCallback(async (calculation: ShippingCostCalculation): Promise<ShippingCostResult> => {
    try {
      const data = await makeApiCall('/shipping-methods/calculate-cost', {
        method: 'POST',
        body: JSON.stringify(calculation),
      });
      
      return data.calculation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate shipping cost';
      setState(prev => ({ ...prev, shippingError: errorMessage }));
      throw error;
    }
  }, [makeApiCall]);

  // Calculate shipping costs for all available methods
  const calculateAllShippingCosts = useCallback(async (params: Omit<ShippingCostCalculation, 'shippingMethodId'>): Promise<ShippingCostResult[]> => {
    setState(prev => ({ ...prev, shippingIsLoading: true, shippingError: null }));
    
    try {
      // First fetch all shipping methods if not already loaded
      let methods = state.shippingMethods;
      if (methods.length === 0) {
        const response = await makeApiCall('/shipping-methods');
        methods = response.data || [];
      }
      
      // Calculate cost for each method
      const calculations = await Promise.all(
        methods.map(async (method) => {
          try {
            const response = await makeApiCall('/shipping-methods/calculate', {
              method: 'POST',
              body: JSON.stringify({
                shippingMethodId: method.id,
                ...params
              }),
            });
            
            return {
              methodId: method.id,
              methodName: method.name,
              baseCost: response.data.calculation.base_rate,
              weightCost: response.data.calculation.weight_cost,
              distanceCost: response.data.calculation.distance_cost,
              totalCost: response.data.calculation.total_cost,
              estimatedDays: `${method.estimated_days_min}-${method.estimated_days_max} days`
            };
          } catch (error) {
            console.warn(`Failed to calculate cost for method ${method.id}:`, error);
            return {
              methodId: method.id,
              methodName: method.name,
              baseCost: parseFloat(method.base_cost),
              weightCost: 0,
              distanceCost: 0,
              totalCost: parseFloat(method.base_cost),
              estimatedDays: `${method.estimated_days_min}-${method.estimated_days_max} days`
            };
          }
        })
      );
      
      setState(prev => ({ ...prev, shippingIsLoading: false }));
      return calculations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate shipping costs';
      setState(prev => ({
        ...prev,
        shippingError: errorMessage,
        shippingIsLoading: false,
      }));
      throw error;
    }
  }, [makeApiCall, state.shippingMethods]);

  // Create new shipping method (admin only)
  const createShippingMethod = useCallback(async (methodData: Omit<ShippingMethod, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShippingMethod> => {
    setState(prev => ({ ...prev, shippingIsLoading: true, shippingError: null }));
    
    try {
      const data = await makeApiCall('/shipping-methods', {
        method: 'POST',
        body: JSON.stringify(methodData),
      });
      
      setState(prev => ({
        ...prev,
        shippingMethods: [...prev.shippingMethods, data.shippingMethod],
        shippingIsLoading: false,
      }));
      
      return data.shippingMethod;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create shipping method';
      setState(prev => ({
        ...prev,
        shippingError: errorMessage,
        shippingIsLoading: false,
      }));
      throw error;
    }
  }, [makeApiCall]);

  // Update shipping method (admin only)
  const updateShippingMethod = useCallback(async (methodId: number, methodData: Partial<ShippingMethod>): Promise<ShippingMethod> => {
    try {
      const data = await makeApiCall(`/shipping-methods/${methodId}`, {
        method: 'PUT',
        body: JSON.stringify(methodData),
      });
      
      setState(prev => ({
        ...prev,
        shippingMethods: prev.shippingMethods.map(method => 
          method.id === methodId ? data.shippingMethod : method
        ),
      }));
      
      return data.shippingMethod;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update shipping method';
      setState(prev => ({ ...prev, shippingError: errorMessage }));
      throw error;
    }
  }, [makeApiCall]);

  // Delete shipping method (admin only)
  const deleteShippingMethod = useCallback(async (methodId: number): Promise<void> => {
    try {
      await makeApiCall(`/shipping-methods/${methodId}`, {
        method: 'DELETE',
      });
      
      setState(prev => ({
        ...prev,
        shippingMethods: prev.shippingMethods.filter(method => method.id !== methodId),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete shipping method';
      setState(prev => ({ ...prev, shippingError: errorMessage }));
      throw error;
    }
  }, [makeApiCall]);

  // Clear shipping error
  const clearShippingError = useCallback(() => {
    setState(prev => ({ ...prev, shippingError: null }));
  }, []);

  return {
    // State
    shippingMethods: state.shippingMethods,
    shippingIsLoading: state.shippingIsLoading,
    shippingError: state.shippingError,
    
    // Actions
    fetchShippingMethods,
    getShippingMethodById,
    calculateShippingCost,
    calculateAllShippingCosts,
    createShippingMethod,
    updateShippingMethod,
    deleteShippingMethod,
    clearShippingError,
  };
};