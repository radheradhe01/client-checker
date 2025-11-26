import { Client, Account, Databases, Storage, Teams } from 'node-appwrite';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY } from './config';

export const createAdminClient = async () => {
    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setKey(APPWRITE_API_KEY);

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        },
        get storage() {
            return new Storage(client);
        },
        get teams() {
            return new Teams(client);
        },
    };
};

export const createSessionClient = async (session: string) => {
    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID);

    if (session) {
        client.setSession(session);
    }

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        },
    };
};
