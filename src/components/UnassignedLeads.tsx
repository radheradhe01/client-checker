'use client';

import { useState, useEffect, useCallback } from 'react';
import { client, databases } from '@/lib/appwrite/client';
import { APPWRITE_DATABASE_ID, APPWRITE_LEADS_COLLECTION_ID } from '@/lib/appwrite/config';
import { Query } from 'appwrite';
import LeadCard from './LeadCard';
import toast, { Toaster } from 'react-hot-toast';

// Simple debounce function if lodash is not available
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function UnassignedLeads() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [lastId, setLastId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);

    const PAGE_SIZE = 20;

    useEffect(() => {
        // Reset list when search changes
        setLeads([]);
        setLastId(null);
        setHasMore(true); // Assume more initially
        fetchLeads(null, debouncedSearch, true);
    }, [debouncedSearch]);

    useEffect(() => {
        // Realtime Subscription
        const unsubscribe = client.subscribe(
            `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_LEADS_COLLECTION_ID}.documents`,
            (response) => {
                const event = response.events[0];
                const payload = response.payload as any;

                // Only update if we are not searching (realtime search is complex)
                if (debouncedSearch) return;

                if (event.includes('.create')) {
                    if (!payload.assignedEmployeeId) {
                        setLeads((prev) => [payload, ...prev]);
                    }
                } else if (event.includes('.update')) {
                    if (payload.assignedEmployeeId) {
                        setLeads((prev) => prev.filter((l) => l.$id !== payload.$id));
                    } else {
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
    }, [debouncedSearch]);

    const fetchLeads = async (cursor: string | null = null, search: string = '', isNewSearch: boolean = false) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('limit', PAGE_SIZE.toString());
            params.append('status', 'Unassigned');
            params.append('assignedTo', 'null'); // Special value for isNull check

            if (cursor) params.append('cursor', cursor);
            if (search) params.append('search', search);

            const res = await fetch(`/api/leads?${params.toString()}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to fetch leads');

            if (isNewSearch) {
                setLeads(data.documents);
            } else {
                setLeads((prev) => [...prev, ...data.documents]);
            }

            setHasMore(data.documents.length === PAGE_SIZE);
            if (data.documents.length > 0) {
                setLastId(data.documents[data.documents.length - 1].$id);
            } else {
                setLastId(null);
            }

        } catch (error) {
            console.error('Error fetching leads:', error);
            toast.error('Failed to load leads');
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (lastId) {
            fetchLeads(lastId, debouncedSearch, false);
        }
    };

    const handleClaim = async (leadId: string) => {
        setClaiming(leadId);
        try {
            const res = await fetch('/api/leads/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to claim lead');
            }

            setLeads((prev) => prev.filter((l) => l.$id !== leadId));
            toast.success('Lead claimed successfully!');

        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
            // Refresh leads in case of sync issue
            if (!debouncedSearch) fetchLeads(null, '', true);
        } finally {
            setClaiming(null);
        }
    };

    return (
        <>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Unassigned Leads ({leads.length}{hasMore ? '+' : ''})
                    </h2>
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Search company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {loading && leads.length === 0 ? (
                    <div className="text-center py-10">Loading pool...</div>
                ) : (
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
                    </div>
                )}

                {!loading && leads.length === 0 && (
                    <div className="col-span-full text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No unassigned leads found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchQuery ? 'Try adjusting your search terms' : 'Check back later or upload more leads'}
                        </p>
                    </div>
                )}

                {hasMore && (
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={loadMore}
                            disabled={loading}
                            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md shadow-sm text-sm font-medium disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Load More Leads'}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
