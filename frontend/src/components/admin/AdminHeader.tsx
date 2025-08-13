// frontend/src/components/admin/AdminHeader.tsx
'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AdminHeader: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <header className="bg-white dark:bg-gray-800 h-16 flex items-center justify-end px-6 border-b dark:border-gray-700">
            <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                    Welcome, {user?.username || 'Admin'}
                </span>
                <button
                    onClick={logout}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 text-sm font-medium"
                >
                    Logout
                </button>
            </div>
        </header>
    );
};

export default AdminHeader;