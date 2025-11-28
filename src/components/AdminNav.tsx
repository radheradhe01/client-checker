'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminLogoutButton from './AdminLogoutButton';

export default function AdminNav() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/admin' && pathname === '/admin') return true;
        if (path !== '/admin' && pathname?.startsWith(path)) return true;
        return false;
    };

    const getLinkClasses = (path: string) => {
        const baseClasses = "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium";
        const activeClasses = "border-indigo-500 text-gray-900";
        const inactiveClasses = "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700";

        return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-indigo-600">CRM Admin</span>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link href="/admin" className={getLinkClasses('/admin')}>
                                Dashboard
                            </Link>
                            <Link href="/admin/leads" className={getLinkClasses('/admin/leads')}>
                                Leads
                            </Link>
                            <Link href="/admin/users" className={getLinkClasses('/admin/users')}>
                                Users
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <AdminLogoutButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}
