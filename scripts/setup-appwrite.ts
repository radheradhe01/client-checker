import { Client, Databases, Storage, Teams, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!PROJECT_ID || !API_KEY) {
    console.error('Error: NEXT_PUBLIC_APPWRITE_PROJECT_ID and APPWRITE_API_KEY must be set in .env.local');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);
const teams = new Teams(client);

const DB_NAME = 'CRM_DB';
const LEADS_COLLECTION_NAME = 'Leads';
const BUCKET_NAME = 'CSV_Uploads';

async function main() {
    console.log('Starting Appwrite Setup...');

    // 1. Create Database
    let dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    if (!dbId) {
        console.log('Creating Database...');
        const db = await databases.create('unique()', DB_NAME);
        dbId = db.$id;
        console.log(`Database created: ${dbId}`);
    } else {
        console.log(`Using existing Database: ${dbId}`);
    }

    // 2. Create Leads Collection
    let collectionId = process.env.NEXT_PUBLIC_APPWRITE_LEADS_COLLECTION_ID;
    if (!collectionId) {
        console.log('Creating Leads Collection...');
        const collection = await databases.createCollection(dbId, 'unique()', LEADS_COLLECTION_NAME, [
            Permission.read(Role.any()), // Adjust permissions as needed
            Permission.create(Role.team('admin')),
            Permission.update(Role.team('admin')),
            Permission.update(Role.team('employee')), // Employees need to update to claim
            Permission.delete(Role.team('admin')),
        ]);
        collectionId = collection.$id;
        console.log(`Leads Collection created: ${collectionId}`);

        // Create Attributes
        console.log('Creating Attributes...');
        await databases.createStringAttribute(dbId, collectionId, 'frn', 255, true);
        await databases.createStringAttribute(dbId, collectionId, 'company_name', 255, true);
        await databases.createEmailAttribute(dbId, collectionId, 'contact_email', true);
        await databases.createStringAttribute(dbId, collectionId, 'contact_phone', 50, true);
        await databases.createStringAttribute(dbId, collectionId, 'service_type', 255, false);
        await databases.createUrlAttribute(dbId, collectionId, 'website', false);
        await databases.createStringAttribute(dbId, collectionId, 'assignedEmployeeId', 255, false);
        await databases.createEnumAttribute(dbId, collectionId, 'pipelineStatus', [
            'Unassigned', 'Email Sent', 'Client Replied', 'Plan Sent', 'Rate Finalized', 'Docs Signed', 'Testing', 'Approved', 'Rejected'
        ], false, 'Unassigned');
        // History is an array of strings (JSON stringified) or we can use a separate collection. User asked for "history array".
        // Appwrite doesn't support array of objects directly well in attributes unless we use string array and JSON parse.
        await databases.createStringAttribute(dbId, collectionId, 'history', 10000, false, undefined, true); // Array of strings

        console.log('Attributes created.');
    } else {
        console.log(`Using existing Leads Collection: ${collectionId}`);
    }

    // 3. Create Storage Bucket
    let bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;
    if (!bucketId) {
        console.log('Creating Storage Bucket...');
        const bucket = await storage.createBucket('unique()', BUCKET_NAME, [
            Permission.read(Role.team('admin')),
            Permission.create(Role.team('admin')),
            Permission.update(Role.team('admin')),
            Permission.delete(Role.team('admin')),
        ]);
        bucketId = bucket.$id;
        console.log(`Storage Bucket created: ${bucketId}`);
    } else {
        console.log(`Using existing Storage Bucket: ${bucketId}`);
    }

    // 4. Create Teams
    console.log('Creating Teams...');
    try {
        await teams.create('admin', 'Admin');
        console.log('Admin Team created.');
    } catch (e: any) {
        if (e.code === 409) console.log('Admin Team already exists.');
        else throw e;
    }

    try {
        await teams.create('employee', 'Employee');
        console.log('Employee Team created.');
    } catch (e: any) {
        if (e.code === 409) console.log('Employee Team already exists.');
        else throw e;
    }

    console.log('\n--- SETUP COMPLETE ---');
    console.log('Please update your .env.local with the following IDs:');
    console.log(`NEXT_PUBLIC_APPWRITE_DATABASE_ID=${dbId}`);
    console.log(`NEXT_PUBLIC_APPWRITE_LEADS_COLLECTION_ID=${collectionId}`);
    console.log(`NEXT_PUBLIC_APPWRITE_BUCKET_ID=${bucketId}`);
}

main().catch(console.error);
