import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/session';
import { createAdminClient } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID, APPWRITE_LEADS_COLLECTION_ID } from '@/lib/appwrite/config';
import { cookies } from 'next/headers';

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

        // Get user from session
        const user = await getUserFromRequest(req);
        const userId = user.$id;

        const { databases } = await createAdminClient();

        // Fetch lead to check ownership
        const lead = await databases.getDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_LEADS_COLLECTION_ID,
            id
        );

        // Verify ownership: Only the assigned employee can update their lead
        if (lead.assignedEmployeeId !== userId) {
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
