'use client';

import { useRouter } from 'next/navigation';

export default function AdminLogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            // Import client-side only
            const { account } = await import('@/lib/appwrite/client');
            await account.deleteSession('current');
            // Force hard reload to clear any state
            window.location.href = '/login?role=admin';
        } catch (error) {
            console.error('Logout failed', error);
            window.location.href = '/login?role=admin';
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
        >
            Logout
        </button>
    );
}
