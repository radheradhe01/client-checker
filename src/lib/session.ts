import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { Account, Client, Databases } from 'node-appwrite';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from './appwrite/config';

/**
 * Create a session-based client for authenticated requests
 * Reads the session cookie and creates a client with that session
 */
import { createAdminClient } from './appwrite/server';

/**
 * Create a session-based client for authenticated requests
 * Reads the session cookie and creates a client with that session
 */
export async function createSessionClient() {
    const cookieStore = await cookies();

    // Check for Dev Session first
    const devSession = cookieStore.get('dev_session');
    if (devSession && devSession.value) {
        // Dev Mode: Use Admin Client (bypasses rate limits)
        const { databases } = await createAdminClient();

        // Mock account.get() based on dev session
        // We can encode role in the cookie value if needed, for now assume admin
        const mockUser = {
            $id: 'dev-admin',
            name: 'Dev Admin',
            email: 'admin@crm.local',
            emailVerification: true,
            status: true,
            labels: ['admin'],
            prefs: {}
        };

        console.log('[SESSION_DEBUG] Dev Mode Active. Mock User:', mockUser);

        return {
            get account() {
                return {
                    get: async () => mockUser,
                    // Mock other methods if needed
                    createEmailPasswordSession: async () => ({}),
                    deleteSession: async () => ({}),
                } as any;
            },
            get databases() {
                return databases;
            },
            user: mockUser // EXPOSE MOCK USER HERE
        };
    }

    // Get session cookie
    const sessionCookie = cookieStore.get('session') ||
        cookieStore.get('a_session_console') ||
        cookieStore.get(`a_session_${APPWRITE_PROJECT_ID}`);

    console.log('[SESSION_DEBUG] Cookies available:', {
        hasSession: !!cookieStore.get('session'),
        hasConsole: !!cookieStore.get('a_session_console'),
        hasProject: !!cookieStore.get(`a_session_${APPWRITE_PROJECT_ID}`),
        allCookies: cookieStore.getAll().map(c => c.name)
    });

    if (!sessionCookie) {
        console.error('[SESSION_DEBUG] No session cookie found');
        throw new Error('No session found');
    }



    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID);

    // Set the session
    client.setSession(sessionCookie.value);

    const account = new Account(client);
    const databases = new Databases(client);

    // Get user to retrieve labels
    let userWithLabels;
    try {
        userWithLabels = await account.get();
    } catch (error) {
        throw new Error('Invalid session');
    }

    return {
        get account() {
            return account;
        },
        get databases() {
            return databases;
        },
        user: userWithLabels // Expose user with labels
    };
}

/**
 * Extract and validate user session
 * @returns User object with $id, email, name, etc.
 * @throws Error if not authenticated
 */
export async function getUserFromRequest() {
    try {
        const { account } = await createSessionClient();
        const user = await account.get();
        return user;
    } catch (error) {
        throw new Error('Unauthorized: Invalid or missing session');
    }
}

export async function requireAdmin() {
    const { user } = await createSessionClient();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const isAdmin = user.labels && user.labels.includes('admin');

    // Check for dev admin
    const cookieStore = await cookies();
    const devSession = cookieStore.get('dev_session');
    if (devSession && devSession.value === 'admin') {
        return true;
    }

    if (!isAdmin) {
        throw new Error('Forbidden: Admin access required');
    }

    return user;
}

/**
 * Require authentication, throw if not logged in
 */
export async function requireAuth(request?: NextRequest) {
    const user = await getUserFromRequest();
    if (!user) {
        throw new Error('Authentication required');
    }
    return user;
}
