'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, Order } from '../types';
import { useAuth } from '../contexts/AuthContext';

// The custom hook
export const useProfile = (userId: string | null) => {
    const { token, updateUser } = useAuth();
    const [profile, setProfile] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all data concurrently for speed
            const [profileRes, ordersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/users/${userId}`),
                fetch(`${API_BASE_URL}/api/orders?buyerId=${userId}`),
            ]);

            if (!profileRes.ok) {
                throw new Error(`Failed to fetch profile data: ${profileRes.status} ${profileRes.statusText}`);
            }
            
            if (!ordersRes.ok) {
                throw new Error(`Failed to fetch orders data: ${ordersRes.status} ${ordersRes.statusText}`);
            }

            const profileData = await profileRes.json();
            const ordersData = await ordersRes.json();

            setProfile(profileData.data);
            setOrders(ordersData.data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId, API_BASE_URL]);

    const updateProfile = useCallback(async (profileData: Partial<User>) => {
        if (!userId || !token) {
            setUpdateError('Not authenticated');
            return { success: false, error: 'Not authenticated' };
        }

        setUpdateLoading(true);
        setUpdateError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(profileData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update profile');
            }

            if (result.success) {
                // Update local state
                setProfile(result.data);
                // Update auth context
                updateUser(result.data);
                return { success: true, data: result.data };
            } else {
                throw new Error(result.error || 'Update failed');
            }
        } catch (err: any) {
            setUpdateError(err.message);
            return { success: false, error: err.message };
        } finally {
            setUpdateLoading(false);
        }
    }, [userId, token, updateUser, API_BASE_URL]);

    useEffect(() => {
        //_ 5. A cleaner check: only run the fetch logic if we have a valid userId.
        if (userId) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [userId, fetchData]);

    // Return the state and a function to refetch the data manually if needed
    return { 
        profile, 
        orders, 
        profileLoading: loading, 
        error, 
        refetchData: fetchData,
        updateProfile,
        updateLoading,
        updateError
    };
};