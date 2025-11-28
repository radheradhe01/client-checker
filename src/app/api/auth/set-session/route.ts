import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const { secret } = await request.json();

        if (!secret) {
            return NextResponse.json({ error: 'Missing secret' }, { status: 400 });
        }

        const cookieStore = await cookies();

        // Set the session cookie
        // This allows the server-side client (createSessionClient) to pick it up
        cookieStore.set('session', secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 365, // 1 year
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
