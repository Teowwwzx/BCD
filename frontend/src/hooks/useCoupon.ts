// src/hooks/useCoupon.ts
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Coupon, ApplyCouponPayload, ValidateCouponPayload, ApplyCouponResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useCoupon = () => {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const apiCall = useCallback(async <T>(endpoint: string, options: RequestInit): Promise<T | null> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/coupons${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...options.headers,
                },
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'An API error occurred');
            }
            return result.data as T;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [token]);

    /**
     * Validates if a coupon is usable for a specific user and order amount.
     */
    const validateCoupon = useCallback(async (payload: ValidateCouponPayload) => {
        const response = await apiCall<{ valid: boolean; message: string }>('/validate', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return response;
    }, [apiCall]);

    /**
     * Calculates the discount for a given coupon code and order amount.
     */
    const applyCoupon = useCallback(async (payload: ApplyCouponPayload) => {
        const response = await apiCall<ApplyCouponResponse>('/apply', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return response;
    }, [apiCall]);

    // --- Admin Functions ---

    const createCoupon = useCallback(async (couponData: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'usage_count'>) => {
        return await apiCall<Coupon>('/', {
            method: 'POST',
            body: JSON.stringify(couponData),
        });
    }, [apiCall]);

    const updateCoupon = useCallback(async (couponId: number, couponData: Partial<Coupon>) => {
        return await apiCall<Coupon>(`/${couponId}`, {
            method: 'PUT',
            body: JSON.stringify(couponData),
        });
    }, [apiCall]);

    const getCoupons = useCallback(async () => {
        return await apiCall<Coupon[]>('/', { method: 'GET' });
    }, [apiCall]);

    const deleteCoupon = useCallback(async (couponId: number) => {
        return await apiCall<Coupon>(`/${couponId}`, {
            method: 'DELETE',
        });
    }, [apiCall]);

    return {
        loading,
        error,
        validateCoupon,
        applyCoupon,
        createCoupon,
        updateCoupon,
        getCoupons,
    };
};