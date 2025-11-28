import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const LEADS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_LEADS_COLLECTION_ID;

if (!PROJECT_ID || !API_KEY || !DATABASE_ID || !LEADS_COLLECTION_ID) {
    console.error('Error: Missing environment variables');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function main() {
    console.log('Fixing Appwrite Permissions...');

    try {
        // Update Leads Collection Permissions
        // We want:
        // Read: Any authenticated user (Role.users()) - We filter data in the API
        // Create: Admin only (Role.team('admin'))
        // Update: Employees (to claim/update) and Admins
        // Delete: Admin only

        console.log(`Updating collection: ${LEADS_COLLECTION_ID}`);

        await databases.updateCollection(
            DATABASE_ID,
            LEADS_COLLECTION_ID,
            'Leads',
            [
                Permission.read(Role.users()),      // Allow any logged-in user to read (API enforces isolation)
                Permission.create(Role.team('admin')),
                Permission.update(Role.team('employee')),
                Permission.update(Role.team('admin')),
                Permission.delete(Role.team('admin')),
            ]
        );

        console.log('✅ Permissions updated successfully!');
        console.log('Read: Role.users()');
        console.log('Update: Role.team("employee"), Role.team("admin")');

    } catch (error) {
        console.error('Failed to update permissions:', error);
    }
}

main();
