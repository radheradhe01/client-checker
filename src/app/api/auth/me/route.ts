import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/session';

export async function GET() {
    try {
        const user = await getUserFromRequest();

        // Return only necessary user info
        return NextResponse.json({
            $id: user.$id,
            email: user.email,
            name: user.name,
            labels: user.labels || [],
        });
    } catch (error: any) {
        console.error('/api/auth/me error:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
