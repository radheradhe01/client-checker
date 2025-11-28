import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();

        // Delete all session cookies
        cookieStore.delete('dev_session');
        cookieStore.delete('session');
        cookieStore.delete('a_session_console');
        cookieStore.delete(`a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
