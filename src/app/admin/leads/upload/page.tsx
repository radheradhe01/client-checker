'use client';

import { useState } from 'react';
import { client, storage } from '@/lib/appwrite/client';
import { ID } from 'appwrite';

export default function UploadLeadsPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setMessage(null);

        try {
            const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;
            if (!bucketId) throw new Error('Bucket ID not configured');

            // Upload file to Appwrite Storage
            const response = await storage.createFile(
                bucketId,
                ID.unique(),
                file
            );

            console.log('File uploaded:', response);
            setMessage({ type: 'success', text: 'File uploaded. Processing...' });

            // Trigger processing
            const processRes = await fetch('/api/admin/process-csv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileId: response.$id }),
            });

            const data = await processRes.json();

            if (!processRes.ok) {
                setMessage({ type: 'error', text: data.error || 'Failed to process CSV file' });
                setUploading(false);
                return;
            }

            // Show detailed summary
            const summary = data.summary;
            const details = data.details;

            let successMessage = `Import complete!\n\n`;
            successMessage += `✅ Created: ${summary.created}\n`;
            if (summary.duplicates > 0) successMessage += `⏭️  Skipped (duplicates): ${summary.duplicates}\n`;
            if (summary.validation_errors > 0) successMessage += `❌ Validation errors: ${summary.validation_errors}\n`;
            if (summary.failed > 0) successMessage += `⚠️  Failed: ${summary.failed}\n`;

            if (details.validation_errors && details.validation_errors.length > 0) {
                successMessage += `\nFirst validation errors:\n`;
                details.validation_errors.slice(0, 5).forEach((err: any) => {
                    successMessage += `Row ${err.row}: ${err.field} - ${err.error}\n`;
                });
            }

            setMessage({ type: 'success', text: successMessage });

            setFile(null);
            (document.getElementById('file-upload') as HTMLInputElement).value = '';

        } catch (error: any) {
            console.error('Upload failed:', error);
            setMessage({ type: 'error', text: error.message || 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Upload Leads CSV
                    </h2>
                </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Select a CSV file
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>
                            Ensure your CSV has the following columns: <code>frn</code>, <code>company_name</code>, <code>contact_email</code>, <code>contact_phone</code>.
                        </p>
                    </div>
                    <form className="mt-5 sm:flex sm:items-center" onSubmit={handleUpload}>
                        <div className="w-full sm:max-w-xs">
                            <label htmlFor="file-upload" className="sr-only">
                                Choose file
                            </label>
                            <input
                                type="file"
                                name="file-upload"
                                id="file-upload"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!file || uploading}
                            className={`mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${(!file || uploading) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </form>

                    {message && (
                        <div className={`mt-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
