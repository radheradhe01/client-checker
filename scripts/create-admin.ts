import { Client, Account, Teams } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const account = new Account(client);
const teams = new Teams(client);

async function main() {
    console.log('Creating admin user...');

    // Read from environment variables or use defaults (for development only)
    const email = process.env.ADMIN_EMAIL || 'admin@crm.local';
    const password = process.env.ADMIN_PASSWORD || 'admin123456';
    const name = process.env.ADMIN_NAME || 'Admin User';

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        console.warn('⚠️  Warning: Using default admin credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local for production.');
    }

    try {
        // Create admin user
        const user = await account.create('unique()', email, password, name);
        console.log(`✅ Admin user created: ${user.$id}`);

        // Add to admin team - use createMembership with email parameter
        try {
            await teams.createMembership('admin', [email], undefined, email);
            console.log('✅ Added to Admin team');
        } catch (teamError: any) {
            console.log('⚠️  Could not add to team:', teamError.message);
            console.log('   Trying alternative method...');
            // Alternative: use the userId
            await teams.createMembership('admin', [], user.$id);
            console.log('✅ Added to Admin team (alternative method)');
        }

        console.log('\n--- Admin Credentials ---');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('\nYou can now login at http://localhost:3001/login');

    } catch (error: any) {
        if (error.code === 409) {
            console.log('⚠️  Admin user already exists');
            console.log('\n--- Admin Credentials ---');
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
        } else {
            console.error('Error:', error.message);
        }
    }
}

main().catch(console.error);
