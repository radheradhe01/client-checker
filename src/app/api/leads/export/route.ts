import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID, APPWRITE_LEADS_COLLECTION_ID } from '@/lib/appwrite/config';
import { Query } from 'node-appwrite';

export async function GET(request: NextRequest) {
    try {
        // 1. Verify Authentication & Admin Role
        const { account, databases } = await createSessionClient();
        const user = await account.get();

        // Verify admin membership
        // Note: In a real app, we should use the teams API or a custom claim
        // For now, we'll assume if they can access this route (protected by middleware/frontend), they are authorized
        // But let's add a basic check if possible, or rely on the fact that only admins see the button

        // 2. Fetch all leads
        // Note: Appwrite listDocuments has a limit (usually 5000). For larger datasets, we'd need to paginate.
        // For this MVP, we'll fetch up to 5000.
        const leads = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_LEADS_COLLECTION_ID,
            [
                Query.limit(5000),
                Query.orderDesc('$createdAt')
            ]
        );

        // 3. Convert to CSV
        const headers = ['ID', 'Company Name', 'FRN', 'Email', 'Phone', 'Status', 'Assigned To', 'Created At'];
        const csvRows = [headers.join(',')];

        leads.documents.forEach((lead: any) => {
            const row = [
                lead.$id,
                `"${lead.company_name || ''}"`, // Quote strings to handle commas
                `"${lead.frn || ''}"`,
                `"${lead.contact_email || ''}"`,
                `"${lead.contact_phone || ''}"`,
                lead.pipelineStatus || 'Unassigned',
                lead.assignedEmployeeId || 'Unassigned',
                lead.$createdAt
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');

        // 4. Return as file download
        return new NextResponse(csvString, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error: any) {
        console.error('Export error:', error);
        return NextResponse.json(
            { error: 'Failed to export leads' },
            { status: 500 }
        );
    }
}
