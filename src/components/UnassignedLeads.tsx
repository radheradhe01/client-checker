'use client';

import { useState, useEffect } from 'react';
import { client, databases } from '@/lib/appwrite/client';
import { APPWRITE_DATABASE_ID, APPWRITE_LEADS_COLLECTION_ID } from '@/lib/appwrite/config';
import { Query } from 'appwrite';
import LeadCard from './LeadCard';
import toast, { Toaster } from 'react-hot-toast';

export default function UnassignedLeads() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);

    useEffect(() => {
        fetchLeads();

        // Realtime Subscription
        const unsubscribe = client.subscribe(
            `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_LEADS_COLLECTION_ID}.documents`,
            (response) => {
                // We only care about events that affect the unassigned pool
                // 1. New lead created (and unassigned) -> Add to list
                // 2. Lead updated (assignedEmployeeId changed from null to something) -> Remove from list
                // 3. Lead updated (assignedEmployeeId changed to null - unlikely but possible) -> Add to list
                // 4. Lead deleted -> Remove from list

                const event = response.events[0];
                const payload = response.payload as any;

                if (event.includes('.create')) {
                    if (!payload.assignedEmployeeId) {
                        setLeads((prev) => [payload, ...prev]);
                    }
                } else if (event.includes('.update')) {
                    if (payload.assignedEmployeeId) {
                        // Was assigned, remove it
                        setLeads((prev) => prev.filter((l) => l.$id !== payload.$id));
                    } else {
                        // Still unassigned, update it (or add if missing)
                        setLeads((prev) => {
                            const exists = prev.find((l) => l.$id === payload.$id);
                            if (exists) return prev.map((l) => (l.$id === payload.$id ? payload : l));
                            return [payload, ...prev];
                        });
                    }
                } else if (event.includes('.delete')) {
                    setLeads((prev) => prev.filter((l) => l.$id !== payload.$id));
                }
            }
        );

        return () => {
            unsubscribe();
        };
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                APPWRITE_LEADS_COLLECTION_ID,
                [
                    // Query for unassigned leads (assignedEmployeeId is null)
                    Query.isNull('assignedEmployeeId'),
                    Query.equal('pipelineStatus', 'Unassigned'),
                    Query.orderDesc('$createdAt'),
                    Query.limit(50),
                ]
            );
            setLeads(res.documents);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (leadId: string) => {
        setClaiming(leadId);
        try {
            const res = await fetch('/api/leads/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId }), // userId now extracted server-side
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to claim lead');
            }

            // Optimistic update is handled by Realtime, but we can also remove locally for instant feedback
            setLeads((prev) => prev.filter((l) => l.$id !== leadId));
            toast.success('Lead claimed successfully!');

        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
            // Refresh leads in case of sync issue
            fetchLeads();
        } finally {
            setClaiming(null);
        }
    };

    if (loading) return <div>Loading pool...</div>;

    return (
        <>
            <Toaster position="top-right" />
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Unassigned Leads ({leads.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leads.map((lead) => (
                        <LeadCard
                            key={lead.$id}
                            lead={lead}
                            onClaim={handleClaim}
                            showClaimButton={true}
                            claiming={claiming === lead.$id}
                        />
                    ))}
                    {leads.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No unassigned leads</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                All leads have been claimed! Check back later or upload more leads.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
