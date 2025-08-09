'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

/**
 * A custom hook to fetch a list of all users for the admin dashboard.
 * It will only fetch data if the current user is an admin.
 * @returns A list of users, loading state, error state, and a refetch function.
 */
export const useAdminUsers = () => {
    const { user, token } = useAuth(); // Get the current user and their token
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    const fetchUsers = useCallback(async () => {
        // Security Check: Only proceed if there is a token and the user is an admin.
        if (!token || user?.user_role !== 'admin') {
            setLoading(false);
            // Optional: Set an error if a non-admin tries to use this hook
            // setError('Access denied. Admin privileges required.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Assumes a GET /api/users endpoint on your backend
            const response = await fetch(`${API_BASE_URL}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${token}` // Send the auth token for verification
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users.');
            }

            const result = await response.json();
            if (result.success) {
                setUsers(result.data);
            } else {
                throw new Error(result.error || 'An API error occurred.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, token, API_BASE_URL]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return { users, loading, error, refetch: fetchUsers };
};