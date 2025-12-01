/**
 * Validates that all required Appwrite environment variables are set
 * @throws Error with list of missing variables if any are undefined
 */
function validateAppwriteEnv() {
    const requiredVars = [
        { name: 'NEXT_PUBLIC_APPWRITE_PROJECT_ID', value: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID },
        { name: 'APPWRITE_API_KEY', value: process.env.APPWRITE_API_KEY },
        { name: 'NEXT_PUBLIC_APPWRITE_DATABASE_ID', value: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID },
        { name: 'NEXT_PUBLIC_APPWRITE_LEADS_COLLECTION_ID', value: process.env.NEXT_PUBLIC_APPWRITE_LEADS_COLLECTION_ID },
        { name: 'NEXT_PUBLIC_APPWRITE_BUCKET_ID', value: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID },
    ];

    const missingVars = requiredVars
        .filter(({ value }) => !value || value.trim() === '')
        .map(({ name }) => name);

    if (missingVars.length > 0) {
        throw new Error(
            `Missing required Appwrite environment variables:\n` +
            `  ${missingVars.join('\n  ')}\n\n` +
            `Please set these variables in your .env or .env.local file.\n` +
            `See env.example for reference.`
        );
    }
}

// Validate environment variables on module load
validateAppwriteEnv();

export const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
export const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY!;
export const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const APPWRITE_LEADS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_LEADS_COLLECTION_ID!;
export const APPWRITE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;
