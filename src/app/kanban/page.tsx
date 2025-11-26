'use client';

import KanbanBoard from '@/components/KanbanBoard';

export default function KanbanPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-indigo-600">CRM Sales</span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <a href="/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Dashboard
                                </a>
                                <a href="/kanban" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    My Kanban
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center">
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

            <main className="flex-1 overflow-hidden">
                <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <KanbanBoard />
                </div>
            </main>
        </div>
    );
}
