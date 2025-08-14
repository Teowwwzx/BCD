'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../contexts/ModalContext';
import { useToasts } from '../contexts/ToastContext';
import type { User, UserRole, UserStatus } from '../types';


export type UserMutation = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password?: string }>;


export const useAdminUsers = () => {
    const { token } = useAuth();
    const { showModal } = useModal();
    const { addToast } = useToasts();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    const fetchUsers = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            setUsers(result.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token, API_BASE_URL]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    

    const createUser = async (userData: UserMutation): Promise<boolean> => {
        if (!token) return false;
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(userData),
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            addToast('User created successfully!', 'success');
            await fetchUsers(); // Refresh the user list
            return true;
        } catch (err: any) {
            addToast(err.message, 'error', 'Create Failed');
            return false;
        }
    };

    const updateUser = async (userId: string, userData: UserMutation): Promise<boolean> => {
        if (!token) return false;
        try {
            const numericId = parseInt(userId, 10);

            const response = await fetch(`${API_BASE_URL}/users/${numericId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(userData),
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            addToast('User updated successfully!', 'success');
            await fetchUsers(); // Refresh the user list
            return true;
        } catch (err: any) {
            addToast(err.message, 'error', 'Update Failed');
            return false;
        }
    };

    const deleteUser = async (userId: string, username: string) => {
        if (!token) return;

        showModal({
            title: 'Confirm User Deletion',
            message: `Are you sure you want to permanently delete the user "${username}"? This action cannot be undone.`,
            confirmText: 'Delete User',
            confirmVariant: 'danger',
            onConfirm: async () => {
                try {
                    const numericId = parseInt(userId, 10);
                    const response = await fetch(`${API_BASE_URL}/users/${numericId}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const result = await response.json();
                    if (!result.success) throw new Error(result.error);

                    addToast(`User "${username}" deleted successfully.`, 'success');
                    await fetchUsers(); // Refresh the list
                } catch (err: any) {
                    addToast(err.message, 'error', 'Deletion Failed');
                }
            },
        });
    };

    return { users, loading, error, fetchUsers, createUser, updateUser, deleteUser };
};