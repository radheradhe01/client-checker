import { ReactNode } from 'react';
// In a real app, we would check for Admin Team membership here.
// For now, we'll assume the user is logged in (handled by middleware later) 
// and just provide the layout structure.

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-indigo-600">CRM Admin</span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <a href="/admin" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Dashboard
                                </a>
                                <a href="/admin/leads" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Leads
                                </a>
                                <a href="/admin/users" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Users
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={async () => {
                                    const { account } = await import('@/lib/appwrite/client');
                                    await account.deleteSession('current');
                                    window.location.href = '/login?role=admin';
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
                    {children}
                </div>
            </main>
        </div>
    );
}
