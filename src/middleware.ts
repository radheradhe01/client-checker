import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Protect admin routes with RBAC
    if (path.startsWith('/admin')) {
        const cookieStore = await cookies();
        const devSession = cookieStore.get('dev_session');
        const regularSession = cookieStore.get('session');

        console.log('[MIDDLEWARE] Admin route access attempt:', {
            path,
            hasDevSession: !!devSession,
            hasRegularSession: !!regularSession,
        });

        // Dev session always has admin access
        if (devSession) {
            console.log('[MIDDLEWARE] Dev session detected - granting admin access');
            return NextResponse.next();
        }

        // For real sessions, check for admin label
        try {
            const { createSessionClient } = await import('@/lib/session');
            const sessionClient = await createSessionClient();
            const user = sessionClient.user;

            console.log('[MIDDLEWARE] User session:', {
                userId: user?.$id,
                email: user?.email,
                labels: user?.labels,
            });

            // Ensure user exists
            if (!user) {
                console.warn('[MIDDLEWARE] No user found - redirecting to login');
                return NextResponse.redirect(new URL('/login?role=admin', request.url));
            }

            // Check if user has admin label
            const isAdmin = user.labels && user.labels.includes('admin');

            console.log('[MIDDLEWARE] Admin check:', { isAdmin, labels: user.labels });

            if (!isAdmin) {
                console.warn(`[MIDDLEWARE] Access denied: User ${user.email} has no admin label - redirecting to dashboard`);
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }

            console.log('[MIDDLEWARE] Admin label confirmed - granting access');
            return NextResponse.next();
        } catch (error) {
            console.error('[MIDDLEWARE] Admin middleware auth error:', error);
            return NextResponse.redirect(new URL('/login?role=admin', request.url));
        }
    }

    // Protect employee routes
    if (path.startsWith('/dashboard') || path.startsWith('/kanban')) {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session') ||
            cookieStore.get('a_session_console') ||
            cookieStore.get(`a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);
        const devSession = cookieStore.get('dev_session');

        if (!sessionCookie && !devSession) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    const response = NextResponse.next();

    // SECURITY: Add Security Headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return response;
}

export const config = {
    matcher: ['/admin/:path*', '/dashboard/:path*', '/kanban/:path*']
};
