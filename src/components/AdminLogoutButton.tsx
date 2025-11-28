'use client';

import { useRouter } from 'next/navigation';

export default function AdminLogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            // Use logout API to handle both dev_session and real sessions
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed', error);
            // Force redirect even if logout fails
            router.push('/login');
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
            Logout
        </button>
    );
}
