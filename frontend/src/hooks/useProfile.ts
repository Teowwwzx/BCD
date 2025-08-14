'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, Order } from '../types';

type ProfileUpdateData = Partial<Pick<User, 'f_name' | 'l_name' | 'phone' | 'dob'>>;


// The custom hook
export const useProfile = (userId: number | null) => {
    const [profile, setProfile] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    const fetchData = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            // Fetch all data concurrently for speed
            const [profileRes, ordersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/users/${userId}`),
                fetch(`${API_BASE_URL}/orders?buyerId=${userId}`),
            ]);

            if (!profileRes.ok || !ordersRes.ok) {
                throw new Error('Failed to fetch all profile data.');
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

    useEffect(() => {
        fetchData();
    }, [fetchData]);

const updateProfile = async (updateData: ProfileUpdateData): Promise<User | null> => {
        if (!userId) {
            setError("User not found.");
            return null;
        }
        
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || "Failed to update profile.");
            }
            
            // Optimistically update the local state
            setProfile(result.data);
            return result.data;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { 
        profile, 
        orders, 
        profileLoading: loading, 
        error, 
        refetchData: fetchData,
        updateProfile, // Expose the new function
    };
};