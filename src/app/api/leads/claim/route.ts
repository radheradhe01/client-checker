import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/session';
import { createAdminClient } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID, APPWRITE_LEADS_COLLECTION_ID } from '@/lib/appwrite/config';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { leadId } = body;

        if (!leadId) {
            return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
        }

        // Get user from session (server-side validation)
        const user = await getUserFromRequest(req);
        const userId = user.$id;

        const { databases } = await createAdminClient();

        // Atomic Claim Logic
        // 1. Fetch the current document
        const lead = await databases.getDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_LEADS_COLLECTION_ID,
            leadId
        );

        // 2. Check if already assigned
        if (lead.assignedEmployeeId) {
            return NextResponse.json({ error: 'Lead already claimed' }, { status: 409 });
        }

        const currentSequence = lead.$sequence;

        // 3. Attempt to update
        const updatedLead = await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_LEADS_COLLECTION_ID,
            leadId,
            {
                assignedEmployeeId: userId,
                pipelineStatus: 'Email Sent',
                history: [...(lead.history || []), JSON.stringify({
                    by: userId,
                    action: 'claimed',
                    ts: new Date().toISOString(),
                    sequence: currentSequence
                })]
            }
        );

        // 4. Verify that we successfully claimed it
        if (updatedLead.assignedEmployeeId === userId) {
            return NextResponse.json({ success: true, lead: updatedLead });
        } else {
            // Someone else's update overwrote ours
            return NextResponse.json({ error: 'Lead already claimed' }, { status: 409 });
        }

    } catch (error: any) {
        console.error('Claim Error:', error);

        // Handle authentication errors
        if (error.message?.includes('Unauthorized') || error.message?.includes('session')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
