import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, createSessionClient } from '@/lib/session';
import { createAdminClient } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID, APPWRITE_LEADS_COLLECTION_ID } from '@/lib/appwrite/config';
import { cookies } from 'next/headers';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { databases, user } = await createSessionClient();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const lead = await databases.getDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_LEADS_COLLECTION_ID,
            id
        );

        // RBAC: Check access
        const isAdmin = (user.labels && user.labels.includes('admin')) ||
            (req.cookies.get('dev_session')?.value === 'admin');

        // Allow access if:
        // 1. User is Admin
        // 2. Lead is Unassigned (so they can view details to claim it)
        // 3. Lead is assigned to the user
        const isAssignedToUser = lead.assignedEmployeeId === user.$id;
        const isUnassigned = !lead.assignedEmployeeId;

        if (!isAdmin && !isAssignedToUser && !isUnassigned) {
            return NextResponse.json({ error: 'Forbidden: You do not have access to this lead' }, { status: 403 });
        }

        return NextResponse.json(lead);

    } catch (error: any) {
        console.error('Get Lead Error:', error);
        if (error.message?.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { pipelineStatus } = await req.json();

        if (!pipelineStatus) {
            return NextResponse.json({ error: 'Pipeline Status is required' }, { status: 400 });
        }

        // SECURITY: Validate status against whitelist
        const VALID_STATUSES = [
            'Unassigned', 'Email Sent', 'Client Replied', 'Plan Sent',
            'Rate Finalized', 'Docs Signed', 'Testing', 'Approved', 'Rejected'
        ];
        if (!VALID_STATUSES.includes(pipelineStatus)) {
            return NextResponse.json({ error: 'Invalid pipeline status' }, { status: 400 });
        }

        // Get user from session
        const { user } = await createSessionClient();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = user.$id;
        const isAdmin = (user.labels && user.labels.includes('admin')) ||
            (req.cookies.get('dev_session')?.value === 'admin');

        const { databases } = await createAdminClient();

        // Fetch lead to check ownership
        const lead = await databases.getDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_LEADS_COLLECTION_ID,
            id
        );

        // Verify ownership: Only the assigned employee OR Admin can update
        if (lead.assignedEmployeeId !== userId && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden: You can only update your own leads' }, { status: 403 });
        }

        // Update
        const updatedLead = await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_LEADS_COLLECTION_ID,
            id,
            {
                pipelineStatus,
                history: [...(lead.history || []), JSON.stringify({
                    by: userId,
                    action: `moved to ${pipelineStatus}`,
                    ts: new Date().toISOString()
                })]
            }
        );

        return NextResponse.json({ success: true, lead: updatedLead });

    } catch (error: any) {
        console.error('Update Lead Error:', error);

        // Handle auth errors
        if (error.message?.includes('Unauthorized') || error.message?.includes('session')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
