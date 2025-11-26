'use client';

import { useState, useEffect } from 'react';
import { account } from '@/lib/appwrite/client';
import UnassignedLeads from '@/components/UnassignedLeads';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkUser = async () => {
            try {
                // Use our own API which handles both Appwrite sessions and Dev sessions
                const res = await fetch('/api/auth/me');
                if (!res.ok) throw new Error('Unauthorized');

                const u = await res.json();
                setUser(u);
            } catch (error: any) {
                console.error('Session check failed:', error);
                window.location.href = '/login';
            }
        };
        checkUser();
    }, []);

    if (!user) return <div className="p-8 text-center">Loading session...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-indigo-600">CRM Sales</span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <a href="/dashboard" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Dashboard
                                </a>
                                <a href="/kanban" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    My Kanban
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-4">Hello, {user.name}</span>
                            <button
                                onClick={async () => {
                                    const { account } = await import('@/lib/appwrite/client');
                                    await account.deleteSession('current');
                                    window.location.href = '/login';
                                }}
                                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            View and claim unassigned leads to add them to your pipeline.
                        </p>
                    </div>

                    <UnassignedLeads />
                </div>
            </main>
        </div>
    );
}
