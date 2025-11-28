import { ReactNode } from 'react';
import AdminLogoutButton from '@/components/AdminLogoutButton';
import AdminNav from '@/components/AdminNav';
// In a real app, we would check for Admin Team membership here.
// For now, we'll assume the user is logged in (handled by middleware later) 
// and just provide the layout structure.

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <AdminNav />
            <main className="py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
