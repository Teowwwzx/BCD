// frontend/src/components/AdminHeader.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

const AdminHeader: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <header className="bg-gray-800 text-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-4">
                        <Link href="/admin" className="text-xl font-bold">
                            BCD Admin
                        </Link>
                        <span className="text-red-400 font-semibold">🛡️</span>
                    </div>
                    <nav className="flex items-center space-x-4">
                        <span className="text-sm text-gray-300">
                            Welcome, {user?.username || 'Admin'}
                        </span>
                        <button
                            onClick={logout}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 text-sm font-medium"
                        >
                            Logout
                        </button>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;