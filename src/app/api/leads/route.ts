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
        const limit = parseInt(searchParams.get('limit') || '20');

        const { databases } = await createSessionClient();

        const queries = [
            Query.orderDesc('$createdAt'),
            Query.limit(limit),
        ];

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
                queries.push(Query.equal('assignedEmployeeId', assignedTo));
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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
