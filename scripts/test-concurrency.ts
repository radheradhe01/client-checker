import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_LEADS_COLLECTION_ID!;

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function main() {
    console.log('--- Starting Concurrency Test ---');

    // 1. Create a Test Lead
    console.log('Creating test lead...');
    const lead = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
            frn: 'TEST-FRN-' + Date.now(),
            company_name: 'Test Company',
            contact_email: 'test@example.com',
            contact_phone: '1234567890',
            pipelineStatus: 'Unassigned',
            assignedEmployeeId: null
        }
    );
    console.log(`Lead created: ${lead.$id}`);

    // 2. Simulate Concurrent Claims
    const userIds = ['user1', 'user2', 'user3', 'user4', 'user5'];
    console.log(`Simulating ${userIds.length} concurrent claim attempts...`);

    const promises = userIds.map(userId =>
        fetch('http://localhost:3000/api/leads/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId: lead.$id, userId })
        }).then(async res => ({
            status: res.status,
            userId,
            data: await res.json()
        }))
    );

    const results = await Promise.all(promises);

    // 3. Analyze Results
    const successes = results.filter(r => r.status === 200);
    const conflicts = results.filter(r => r.status === 409);
    const errors = results.filter(r => r.status !== 200 && r.status !== 409);

    console.log('\n--- Results ---');
    console.log(`Total Attempts: ${results.length}`);
    console.log(`Successes: ${successes.length}`);
    console.log(`Conflicts (409): ${conflicts.length}`);
    console.log(`Other Errors: ${errors.length}`);

    if (successes.length === 1 && conflicts.length === userIds.length - 1) {
        console.log('\n✅ TEST PASSED: Atomicity verified. Only one user claimed the lead.');
        console.log(`Winner: ${successes[0].userId}`);
    } else {
        console.log('\n❌ TEST FAILED: Race condition detected or unexpected errors.');
        results.forEach(r => console.log(`User: ${r.userId}, Status: ${r.status}, Msg: ${JSON.stringify(r.data)}`));
    }

    // Cleanup
    console.log('\nCleaning up...');
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, lead.$id);
    console.log('Test lead deleted.');
}

main().catch(console.error);
