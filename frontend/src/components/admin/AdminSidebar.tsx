// frontend/src/components/admin/AdminSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

const adminNavItems = [
    { href: '/admin', label: 'Overview', icon: '📊' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/products', label: 'Products', icon: '📦' },
    { href: '/admin/orders', label: 'Orders', icon: '🛒' },
    { href: '/admin/reviews', label: 'Reviews', icon: '⭐' },
];

const sellerNavItems = [
    { href: '/seller', label: 'Dashboard', icon: '📊' },
    { href: '/seller/products', label: 'My Products', icon: '📦' },
    { href: '/seller/orders', label: 'My Orders', icon: '🛒' },
    { href: '/seller/reviews', label: 'Reviews', icon: '⭐' },
    { href: '/seller/analytics', label: 'Analytics', icon: '📈' },
];

const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const { user } = useAuth();
    
    const isAdmin = user?.user_role === UserRole.Admin;
    const navItems = isAdmin ? adminNavItems : sellerNavItems;
    const dashboardLink = isAdmin ? '/admin' : '/seller';
    const brandText = isAdmin ? 'BCD Admin' : 'BCD Seller';

    return (
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
            <div className="h-16 flex items-center px-6 border-b dark:border-gray-700">
                <Link href={dashboardLink} className="text-xl font-bold text-gray-800 dark:text-white">
                    {brandText}
                </Link>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <span className="mr-3 text-lg">{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;