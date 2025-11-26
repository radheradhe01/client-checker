import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/session';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}
