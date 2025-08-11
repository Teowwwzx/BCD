// frontend/src/hooks/useAddresses.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Address } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useAddresses = () => {
    const { user, token } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchAddresses = useCallback(async () => {
        if (!user || !token) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/addresses/user/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setAddresses(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch addresses', error);
        } finally {
            setLoading(false);
        }
    }, [user, token]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    return { addresses, loading };
};