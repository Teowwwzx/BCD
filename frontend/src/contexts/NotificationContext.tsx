'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useWallet } from './WalletContext'; // Assuming you have a user ID here eventually

// Define the shape of a single notification
export interface Notification {
    id: number;
    userId: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

// Define the shape of the data provided by the context
interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    fetchNotifications: (userId: number) => Promise<void>;
    markAsRead: (notificationId: number) => Promise<void>;
}

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Create the provider component
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // A real app would get the userId from a user/auth context
    // We'll use a placeholder for now.
    const MOCK_USER_ID = 1;

    const API_URL = 'http://localhost:5000/api/notifications';

    // Calculate the unread count from the notifications list
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Fetches notifications from the backend
    const fetchNotifications = useCallback(async (userId: number) => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch notifications.');
            const result = await response.json();
            setNotifications(result.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Marks a single notification as read
    const markAsRead = async (notificationId: number) => {
        // Optimistic Update: Update the UI immediately for a faster feel
        setNotifications(prevNotifications =>
            prevNotifications.map(n =>
                n.id === notificationId ? { ...n, isRead: true } : n
            )
        );

        // Then, send the request to the server in the background
        try {
            const response = await fetch(`${API_URL}/${notificationId}/read`, {
                method: 'PUT',
            });
            if (!response.ok) {
                // If the server fails, revert the change and show an error
                throw new Error('Failed to mark as read.');
            }
        } catch (err: any) {
            setError(err.message);
            // Revert the optimistic update on failure
            fetchNotifications(MOCK_USER_ID);
        }
    };

    // Fetch initial notifications when the component mounts (e.g., when a user logs in)
    useEffect(() => {
        // In a real app, you would check if a user is logged in first
        if (MOCK_USER_ID) {
            fetchNotifications(MOCK_USER_ID);
        }
    }, []); // Runs once on mount

    const value = {
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
    };

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

// Create the custom hook for easy consumption
export const useNotifications = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};