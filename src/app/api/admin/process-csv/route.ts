import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID, APPWRITE_LEADS_COLLECTION_ID, APPWRITE_BUCKET_ID } from '@/lib/appwrite/config';
import { parse } from 'csv-parse/sync';
import { Query } from 'node-appwrite';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation (basic - allows various formats)
const PHONE_REGEX = /^[\d\s\-\+\(\)]{10,}$/;

// FRN validation (assuming 10 digits)
const FRN_REGEX = /^\d{10}$/;

interface CSVRecord {
    frn: string;
    company_name: string;
    contact_email?: string;
    contact_phone?: string;
    service_type?: string;
    website?: string;
}

interface ValidationError {
    row: number;
    field: string;
    value: string;
    error: string;
}

export async function POST(req: NextRequest) {
    try {
        const { fileId } = await req.json();

        if (!fileId) {
            return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
        }

        const { storage, databases } = await createAdminClient();

        // 1. Fetch the uploaded file
        const fileData = await storage.getFileDownload(APPWRITE_BUCKET_ID, fileId);
        const buffer = Buffer.from(fileData);
        const fileContent = buffer.toString('utf-8');

        // 2. Parse CSV
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as CSVRecord[];

        // 3. Validate and process records
        const validationErrors: ValidationError[] = [];
        const validRecords: CSVRecord[] = [];
        const skippedDuplicates: string[] = [];

        // Fetch existing FRNs to check for duplicates
        // We need to fetch ALL existing FRNs to ensure no duplicates are added.
        // We'll use pagination to fetch them in batches.
        const existingFRNs = new Set<string>();
        let cursor: string | null = null;
        let hasMore = true;

        while (hasMore) {
            const queries = [
                Query.limit(5000),
                Query.select(['frn']) // Optimize: only fetch FRN field
            ];

            if (cursor) {
                queries.push(Query.cursorAfter(cursor));
            }

            const batch = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                APPWRITE_LEADS_COLLECTION_ID,
                queries
            );

            batch.documents.forEach((d: any) => {
                if (d.frn) existingFRNs.add(d.frn);
            });

            if (batch.documents.length < 5000) {
                hasMore = false;
            } else {
                cursor = batch.documents[batch.documents.length - 1].$id;
            }
        }

        records.forEach((record, index) => {
            const rowNumber = index + 2; // +2 because 1-indexed and header row

            // Validate required fields
            if (!record.frn || !record.frn.trim()) {
                validationErrors.push({ row: rowNumber, field: 'frn', value: record.frn || '', error: 'FRN is required' });
                return;
            }

            if (!record.company_name || !record.company_name.trim()) {
                validationErrors.push({ row: rowNumber, field: 'company_name', value: record.company_name || '', error: 'Company name is required' });
                return;
            }

            // Validate FRN format
            if (!FRN_REGEX.test(record.frn.trim())) {
                validationErrors.push({ row: rowNumber, field: 'frn', value: record.frn, error: 'FRN must be 10 digits' });
                return;
            }

            // Validate email if provided
            if (record.contact_email && record.contact_email.trim() && !EMAIL_REGEX.test(record.contact_email.trim())) {
                validationErrors.push({ row: rowNumber, field: 'contact_email', value: record.contact_email, error: 'Invalid email format' });
                return;
            }

            // Validate phone if provided
            if (record.contact_phone && record.contact_phone.trim() && !PHONE_REGEX.test(record.contact_phone.trim())) {
                validationErrors.push({ row: rowNumber, field: 'contact_phone', value: record.contact_phone, error: 'Invalid phone format (min 10 digits)' });
                return;
            }

            // Check for duplicates
            if (existingFRNs.has(record.frn.trim())) {
                skippedDuplicates.push(record.frn.trim());
                return;
            }

            validRecords.push(record);
        });

        // 4. Create documents for valid records with batching
        const created: string[] = [];
        const failed: Array<{ frn: string; error: string }> = [];

        // Process in batches of 50 for faster uploads
        const BATCH_SIZE = 100;

        for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
            const batch = validRecords.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (record) => {
                try {
                    await databases.createDocument(
                        APPWRITE_DATABASE_ID,
                        APPWRITE_LEADS_COLLECTION_ID,
                        'unique()',
                        {
                            frn: record.frn.trim(),
                            company_name: record.company_name.trim(),
                            contact_email: record.contact_email?.trim() || null,
                            contact_phone: record.contact_phone?.trim() || null,
                            service_type: record.service_type?.trim() || null,
                            website: record.website?.trim() || null,
                            assignedEmployeeId: null,
                            pipelineStatus: 'Unassigned',
                            history: [JSON.stringify({
                                by: 'admin',
                                action: ' csv_import',
                                ts: new Date().toISOString()
                            })]
                        }
                    );
                    created.push(record.frn.trim());
                } catch (error: any) {
                    failed.push({ frn: record.frn, error: error.message });
                }
            }));
        }

        // 5. Return summary
        return NextResponse.json({
            success: true,
            summary: {
                total: records.length,
                created: created.length,
                duplicates: skippedDuplicates.length,
                validation_errors: validationErrors.length,
                failed: failed.length
            },
            details: {
                created,
                skipped_duplicates: skippedDuplicates,
                validation_errors: validationErrors.slice(0, 10), // Limit to first 10 errors
                failed: failed.slice(0, 10)
            }
        });

    } catch (error: any) {
        console.error('CSV Processing Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to process CSV' }, { status: 500 });
    }
}
