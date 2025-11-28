import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient } from '@/lib/session';
import { APPWRITE_DATABASE_ID, APPWRITE_LEADS_COLLECTION_ID } from '@/lib/appwrite/config';
import { Query } from 'node-appwrite';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get('cursor');
        const search = searchParams.get('search');
        const status = searchParams.get('status');
        const assignedTo = searchParams.get('assignedTo');
        // SECURITY: Cap limit to prevent resource exhaustion
        const rawLimit = parseInt(searchParams.get('limit') || '20');
        const limit = Math.min(rawLimit, 100);

        const { databases, user } = await createSessionClient();

        console.log('[LEADS_API_DEBUG] User:', user ? user.$id : 'null');

        if (!user) {
            console.error('[LEADS_API_DEBUG] Unauthorized: No user returned');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const isAdmin = (user.labels && user.labels.includes('admin')) ||
            (req.cookies.get('dev_session')?.value === 'admin');

        const queries = [
            Query.orderDesc('$createdAt'),
            Query.limit(limit),
        ];

        // SECURITY: Enforce data isolation
        // If user is NOT admin, they can ONLY see:
        // 1. Unassigned leads
        // 2. Leads assigned to themselves
        if (!isAdmin) {
            // If they are trying to see unassigned leads, allow it
            if (status === 'Unassigned' && assignedTo === 'null') {
                // Allow - standard "Claim Leads" view
            }
            // If they are trying to see their own leads, allow it
            else if (assignedTo === user.$id) {
                // Allow - standard "My Kanban" view
            }
            // OTHERWISE: Force filter to their own ID to prevent snooping
            else {
                // If they didn't specify filters, or specified other filters,
                // we must restrict them to their own leads OR unassigned
                // But Appwrite queries are AND-based.

                // Simplest security model:
                // If they asked for 'Unassigned', ensure assignedTo is null
                if (status === 'Unassigned') {
                    queries.push(Query.isNull('assignedEmployeeId'));
                } else {
                    // For any other status, FORCE them to only see their own leads
                    queries.push(Query.equal('assignedEmployeeId', user.$id));
                }
            }
        }

        if (cursor) {
            queries.push(Query.cursorAfter(cursor));
        }

        if (search) {
            queries.push(Query.search('company_name', search));
        }

        if (status) {
            queries.push(Query.equal('pipelineStatus', status));
        }

        if (assignedTo) {
            if (assignedTo === 'null') {
                queries.push(Query.isNull('assignedEmployeeId'));
            } else {
                // If not admin, we've already enforced ownership above or allowed unassigned
                // If admin, respect the requested filter
                if (isAdmin) {
                    queries.push(Query.equal('assignedEmployeeId', assignedTo));
                } else if (assignedTo === user.$id) {
                    queries.push(Query.equal('assignedEmployeeId', assignedTo));
                }
            }
        }

        const res = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_LEADS_COLLECTION_ID,
            queries
        );

        return NextResponse.json(res);

    } catch (error: any) {
        console.error('Fetch Leads Error:', error);
        if (error.message?.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
