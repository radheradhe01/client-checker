import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID, APPWRITE_LEADS_COLLECTION_ID } from '@/lib/appwrite/config';
import { Query } from 'node-appwrite';

export async function GET(req: NextRequest) {
    try {
        const { databases, teams } = await createAdminClient();

        // 1. Fetch all leads (limit 5000 for now, or use pagination for total aggregation)
        // Appwrite listDocuments returns total count.
        // To get distribution, we might need to fetch all or use facets if available (Appwrite doesn't have direct facets yet).
        // We'll fetch a reasonable amount to aggregate in memory for this MVP.

        const leadsRes = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_LEADS_COLLECTION_ID,
            [Query.limit(5000)]
        );

        const leads = leadsRes.documents;

        // 2. Aggregate by Status
        const statusDistribution: Record<string, number> = {};
        const pipelineStages = [
            'Unassigned', 'Email Sent', 'Client Replied', 'Plan Sent',
            'Rate Finalized', 'Docs Signed', 'Testing', 'Approved', 'Rejected'
        ];

        // Initialize
        pipelineStages.forEach(s => statusDistribution[s] = 0);

        leads.forEach((lead: any) => {
            const status = lead.pipelineStatus || 'Unknown';
            statusDistribution[status] = (statusDistribution[status] || 0) + 1;
        });

        const statusData = Object.entries(statusDistribution).map(([name, value]) => ({ name, value }));

        // 3. Aggregate by Employee
        const employeeDistribution: Record<string, number> = {};
        leads.forEach((lead: any) => {
            if (lead.assignedEmployeeId) {
                employeeDistribution[lead.assignedEmployeeId] = (employeeDistribution[lead.assignedEmployeeId] || 0) + 1;
            } else {
                employeeDistribution['Unassigned'] = (employeeDistribution['Unassigned'] || 0) + 1;
            }
        });

        // Resolve Employee Names
        // We need to fetch users to map IDs to Names.
        // We can list users from the team.
        const teamMembers = await teams.listMemberships('employee');
        const employeeNames: Record<string, string> = {};
        teamMembers.memberships.forEach(m => {
            employeeNames[m.userId] = m.userName;
        });

        const employeeData = Object.entries(employeeDistribution).map(([id, value]) => ({
            name: employeeNames[id] || (id === 'Unassigned' ? 'Unassigned' : 'Unknown'),
            value
        }));

        return NextResponse.json({
            totalLeads: leadsRes.total,
            statusData,
            employeeData
        });

    } catch (error: any) {
        console.error('Metrics Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
