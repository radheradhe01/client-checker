import { Client, Storage, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const storage = new Storage(client);

async function main() {
    console.log('Updating bucket permissions...');

    try {
        await storage.updateBucket(
            BUCKET_ID,
            'CSV_Uploads',
            [
                Permission.read(Role.any()),
                Permission.create(Role.any()), // Allow anyone to upload for now (we validate server-side)
                Permission.update(Role.team('admin')),
                Permission.delete(Role.team('admin')),
            ],
            false, // not file security
            true,  // enabled
            undefined, // no size limit
            ['csv', 'text/csv', 'application/csv'], // allowed file extensions
            undefined, // no compression
            undefined, // no encryption
            undefined  // no antivirus
        );

        console.log('✅ Bucket permissions updated');
        console.log('   - Anyone can upload files (validated server-side)');
        console.log('   - Only admins can update/delete');

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

main().catch(console.error);
