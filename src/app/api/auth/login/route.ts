import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Client, Account } from 'node-appwrite';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from '@/lib/appwrite/config';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        // Initialize a "Public" Client (No API Key)
        // This acts like a client-side SDK but running in Node
        const client = new Client()
            .setEndpoint(APPWRITE_ENDPOINT)
            .setProject(APPWRITE_PROJECT_ID);

        const account = new Account(client);

        // Create Session
        // In Node.js environment, this returns the session object WITH the secret
        // because it cannot set a cookie automatically like in a browser
        const session = await account.createEmailPasswordSession(email, password);

        console.log('[AUTH_DEBUG] Session created:', JSON.stringify(session, null, 2));

        if (!session || !session.secret) {
            throw new Error('Failed to retrieve session secret');
        }

        const cookieStore = await cookies();

        // Set the session cookie
        cookieStore.set('session', session.secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 365, // 1 year
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Login API Error:', error);
        return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 401 });
    }
}
