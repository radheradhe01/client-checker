import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Only handle Dev Mode Admin login (for development)
        if (email === 'admin@crm.local' && password === 'admin123456') {
            const cookieStore = await cookies();

            // Set a long-lived cookie for dev session
            cookieStore.set('dev_session', 'admin', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
            });

            return NextResponse.json({ success: true });
        }

        // All other logins should use client-side Appwrite SDK
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
