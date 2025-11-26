import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite/server';
import { ID, Query } from 'node-appwrite';

export async function GET(req: NextRequest) {
    try {
        const { teams } = await createAdminClient();

        // Get Team ID for 'employee' - we need to find it by name or assume a convention/env var
        // For now, let's list memberships of the 'employee' team.
        // In setup script we created team with ID 'employee' if possible, or auto-generated.
        // Let's assume 'employee' is the ID for simplicity as we tried to set it in setup script 
        // (though setup script used teams.create('employee', 'Employee') which sets ID to 'employee').

        const teamId = 'employee';

        const memberships = await teams.listMemberships(teamId);

        return NextResponse.json({
            users: memberships.memberships.map(m => ({
                id: m.userId,
                name: m.userName,
                email: m.userEmail,
                joined: m.joined,
            }))
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { email, password, name } = await req.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { account, teams } = await createAdminClient();

        // 1. Create User
        // Note: account.create creates a user but we are using Server SDK with API Key, 
        // so it creates a user in the project.
        const user = await account.create(ID.unique(), email, password, name);

        // 2. Add to Employee Team - use email in the roles array
        await teams.createMembership('employee', [email]);

        return NextResponse.json({ success: true, user });

    } catch (error: any) {
        console.error('Create User Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
