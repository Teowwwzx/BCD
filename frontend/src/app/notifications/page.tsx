'use client';

import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header';

const NotificationsPage: React.FC = () => {
    const { notifications, loading, error, markAsRead } = useNotifications();
    const { isLoggedIn } = useAuth();

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Notifications</h1>
                        <p className="text-gray-600 dark:text-gray-400">Please log in to view your notifications.</p>
                    </div>
                </div>
            </div>
        );
    }

    const handleNotificationClick = async (notificationId: number, isRead: boolean) => {
        if (!isRead) {
            await markAsRead(notificationId);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Notifications</h1>
                
                {loading && (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading notifications...</span>
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
                    </div>
                )}
                
                {!loading && !error && notifications.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔔</div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No notifications yet</h2>
                        <p className="text-gray-600 dark:text-gray-400">When you have new notifications, they'll appear here.</p>
                    </div>
                )}
                
                {!loading && !error && notifications.length > 0 && (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                                className={`
                                    p-6 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md
                                    ${
                                        notification.isRead
                                            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm'
                                    }
                                `}
                            >
                                <div className="flex items-start space-x-4">
                                    <div className="text-2xl flex-shrink-0">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className={`
                                                text-lg font-semibold truncate
                                                ${
                                                    notification.isRead
                                                        ? 'text-gray-900 dark:text-white'
                                                        : 'text-blue-900 dark:text-blue-100'
                                                }
                                            `}>
                                                {notification.title}
                                            </h3>
                                            {!notification.isRead && (
                                                <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
                                            )}
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500 dark:text-gray-500">
                                                {formatDate(notification.createdAt)}
                                            </span>
                                            <span className={`
                                                text-xs px-2 py-1 rounded-full
                                                ${
                                                    notification.isRead
                                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                        : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                                                }
                                            `}>
                                                {notification.isRead ? 'Read' : 'New'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;