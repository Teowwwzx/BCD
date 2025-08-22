// frontend/src/hooks/useAddresses.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

import { Address } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type CreateAddressData = Omit<Address, 'id' | 'user_id'>;


export const useAddresses = () => {
    const { user, token } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAddresses = useCallback(async () => {
        if (!user || !token) return;
        setLoading(true);
                setError(null);

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

    const createAddress = async (addressData: CreateAddressData): Promise<Address | null> => {
        if (!user || !token) return null;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/addresses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ ...addressData, user_id: user.id }),
            });

            const result = await response.json();
            if (result.success) {
                // Add the new address to the local state to avoid a refetch
                setAddresses(prev => [...prev, result.data]);
                return result.data;
            } else {
                throw new Error(result.error || 'Failed to create address');
            }
        } catch (err: any) {
            console.error('Failed to create address', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateAddress = async (addressId: number, addressData: Partial<CreateAddressData>): Promise<Address | null> => {
        if (!token) return null;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(addressData),
            });

            const result = await response.json();
            if (result.success) {
                // Update the address in the local state
                setAddresses(prev => prev.map(addr => 
                    addr.id === addressId ? result.data : addr
                ));
                return result.data;
            } else {
                throw new Error(result.error || 'Failed to update address');
            }
        } catch (err: any) {
            console.error('Failed to update address', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const setDefaultAddress = async (addressId: number): Promise<boolean> => {
        if (!token) return false;

        setLoading(true);
        setError(null);
        try {
            // First, set all addresses to non-default
            const updatePromises = addresses.map(addr => 
                fetch(`${API_BASE_URL}/addresses/${addr.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ is_default: addr.id === addressId }),
                })
            );

            await Promise.all(updatePromises);
            
            // Update local state
            setAddresses(prev => prev.map(addr => ({
                ...addr,
                is_default: addr.id === addressId
            })));
            
            return true;
        } catch (err: any) {
            console.error('Failed to set default address', err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteAddress = async (addressId: number): Promise<boolean> => {
        if (!token) return false;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const result = await response.json();
            if (result.success) {
                // Remove the address from the local state
                setAddresses(prev => prev.filter(addr => addr.id !== addressId));
                return true;
            } else {
                throw new Error(result.error || 'Failed to delete address');
            }
        } catch (err: any) {
            console.error('Failed to delete address', err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { 
        addresses, 
        loading, 
        error, 
        refetchAddresses: fetchAddresses, 
        createAddress, 
        updateAddress,
        setDefaultAddress,
        deleteAddress 
    };
};