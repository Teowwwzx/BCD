'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, Order } from '../types';


// The custom hook
export const useProfile = (userId: string | null) => {
    const [profile, setProfile] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    const fetchData = useCallback(async () => {
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
        //_ 5. A cleaner check: only run the fetch logic if we have a valid userId.
        if (userId) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [userId, fetchData]);

    // Return the state and a function to refetch the data manually if needed
    return { profile, orders, profileLoading: loading, error, refetchData: fetchData };
};