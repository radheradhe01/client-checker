import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { Account, Client } from 'node-appwrite';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from './config';

/**
 * Create a session-based client for authenticated requests
 * Reads the session cookie and creates a client with that session
 */
export async function createSessionClient() {
    const cookieStore = await cookies();

    // Get session cookie
    const sessionCookie = cookieStore.get('a_session_console') ||
        cookieStore.get(`a_session_${APPWRITE_PROJECT_ID}`);

    if (!sessionCookie) {
        throw new Error('No session found');
    }

    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID);

    // Set the session
    client.setSession(sessionCookie.value);

    return {
        get account() {
            return new Account(client);
        },
    };
}

/**
 * Extract and validate user session from request
 * @returns User object with $id, email, name, etc.
 * @throws Error if not authenticated
 */
export async function getUserFromRequest(request?: NextRequest) {
    try {
        const { account } = await createSessionClient();
        const user = await account.get();
        return user;
    } catch (error) {
        throw new Error('Unauthorized: Invalid or missing session');
    }
}

/**
 * Require authentication, throw if not logged in
 */
export async function requireAuth(request?: NextRequest) {
    const user = await getUserFromRequest(request);
    if (!user) {
        throw new Error('Authentication required');
    }
    return user;
}
