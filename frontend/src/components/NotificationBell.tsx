'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../hooks/useAuth';

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, loading, fetchNotifications } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMarkAsRead = async (notificationId: number) => {
        await markAsRead(notificationId);
    };

    const handleMarkAllAsRead = async () => {
        const unreadNotifications = notifications.filter(n => !n.isRead).slice(0, 5);
        for (const notification of unreadNotifications) {
            await markAsRead(notification.id);
        }
    };

    const handleBellClick = async () => {
        if (!isOpen && user?.id) {
            // Refresh notifications when opening the dropdown
            await fetchNotifications(user.id);
        }
        setIsOpen(!isOpen);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'order':
                return '📦';
            case 'payment':
                return '💳';
            case 'review':
                return '⭐';
            case 'system':
                return '🔔';
            default:
                return '📢';
        }
    };

    // Show only the first 5 notifications
    const displayNotifications = notifications.slice(0, 5);
    const hasUnreadInDisplay = displayNotifications.some(n => !n.isRead);

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={handleBellClick} 
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 relative p-2"
            >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                            {hasUnreadInDisplay && (
                                <button 
                                    onClick={handleMarkAllAsRead}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                        {loading && (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">Loading...</span>
                            </div>
                        )}
                        
                        {!loading && displayNotifications.length === 0 && (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-2">🔔</div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">No notifications yet</p>
                            </div>
                        )}
                        
                        {!loading && displayNotifications.length > 0 && (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {displayNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`
                                            p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors
                                            ${
                                                !notification.isRead
                                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                                    : ''
                                            }
                                        `}
                                        onClick={() => handleMarkAsRead(notification.id)}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="text-lg flex-shrink-0">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className={`
                                                        text-sm font-medium truncate
                                                        ${
                                                            !notification.isRead
                                                                ? 'text-gray-900 dark:text-white'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                        }
                                                    `}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.isRead && (
                                                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                                    {formatDate(notification.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {notifications.length > 5 && (
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                            <Link 
                                href="/notifications" 
                                className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                onClick={() => setIsOpen(false)}
                            >
                                View all notifications ({notifications.length})
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}