'use client';

import { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite/client';
import { APPWRITE_DATABASE_ID, APPWRITE_LEADS_COLLECTION_ID } from '@/lib/appwrite/config';
import { Query } from 'appwrite';
import LeadCard from '@/components/LeadCard';
import toast, { Toaster } from 'react-hot-toast';

// Simple debounce function
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

export default function AdminLeadsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [lastId, setLastId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);

    const PAGE_SIZE = 20;

    useEffect(() => {
        setLeads([]);
        setLastId(null);
        setHasMore(true);
        fetchLeads(null, debouncedSearch, true);
    }, [debouncedSearch]);

    const fetchLeads = async (cursor: string | null = null, search: string = '', isNewSearch: boolean = false) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('limit', PAGE_SIZE.toString());

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

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                    All Leads ({leads.length}{hasMore ? '+' : ''})
                </h1>
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
                <div className="text-center py-10">Loading leads...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leads.map((lead) => (
                        <LeadCard
                            key={lead.$id}
                            lead={lead}
                            showClaimButton={false} // Admins don't claim leads here usually
                        />
                    ))}
                </div>
            )}

            {!loading && leads.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchQuery ? 'Try adjusting your search terms' : 'Upload some leads to get started'}
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
    );
}
