'use client';

import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, loading } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="relative">
                <span className="font-pixel">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-black border-2 border-[#30214f] p-4">
                    <h3 className="font-pixel text-white mb-4">Notifications</h3>
                    {loading && <p>Loading...</p>}
                    <ul>
                        {notifications.map(n => (
                            <li key={n.id} className={`border-b border-dashed border-[#30214f] py-2 ${!n.isRead ? 'text-white' : 'text-gray-500'}`}>
                                <p className="font-bold">{n.title}</p>
                                <p className="text-sm">{n.message}</p>
                                {!n.isRead && (
                                    <button onClick={() => markAsRead(n.id)} className="text-xs text-[#00f5c3] mt-1">
                                        [ Mark as Read ]
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}