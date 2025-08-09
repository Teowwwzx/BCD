'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Order } from '../types'; // Assuming 'Order' type is in your shared types file

export const useOrders = (userId: string | null) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    const fetchOrders = useCallback(async () => {
        // We need a userId to fetch orders
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/orders?buyerId=${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch orders.');
            }
            const data = await response.json();
            setOrders(data.data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId, API_BASE_URL]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return { orders, loading, error, refetchOrders: fetchOrders };
};