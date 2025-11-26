'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { databases } from '@/lib/appwrite/client';
import { APPWRITE_DATABASE_ID, APPWRITE_LEADS_COLLECTION_ID } from '@/lib/appwrite/config';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

export default function LeadDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        company_name: '',
        frn: '',
        contact_email: '',
        contact_phone: '',
        service_type: '',
        website: '',
        notes: ''
    });

    useEffect(() => {
        const fetchLead = async () => {
            try {
                const res = await fetch(`/api/leads/${params.id}`);
                const doc = await res.json();

                if (!res.ok) throw new Error(doc.error || 'Failed to fetch lead');

                setLead(doc);
                setFormData({
                    company_name: doc.company_name || '',
                    frn: doc.frn || '',
                    contact_email: doc.contact_email || '',
                    contact_phone: doc.contact_phone || '',
                    service_type: doc.service_type || '',
                    website: doc.website || '',
                    notes: doc.notes || ''
                });
            } catch (error) {
                console.error('Error fetching lead:', error);
                toast.error('Failed to load lead details');
                router.push('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchLead();
        }
    }, [params.id, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // We need to send pipelineStatus as well if we want to update it, 
            // but here we are just updating details. 
            // The API route expects pipelineStatus for status updates, but maybe we should allow partial updates?
            // Let's check the API route. It requires pipelineStatus.
            // We should probably include the current status.

            const res = await fetch(`/api/leads/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    pipelineStatus: lead.pipelineStatus // Preserve status
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update');

            toast.success('Lead updated successfully');
            // Update local state
            setLead((prev: any) => ({ ...prev, ...formData }));
        } catch (error: any) {
            console.error('Error updating lead:', error);
            toast.error(`Failed to update: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading lead details...</div>
            </div>
        );
    }

    if (!lead) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <Toaster position="top-right" />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={() => router.back()}
                            className="mr-4 text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Lead Details</h1>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${lead.pipelineStatus === 'Unassigned' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                        {lead.pipelineStatus}
                    </span>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                                        Company Name
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="company_name"
                                            id="company_name"
                                            value={formData.company_name}
                                            onChange={handleChange}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="frn" className="block text-sm font-medium text-gray-700">
                                        FRN
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="frn"
                                            id="frn"
                                            value={formData.frn}
                                            onChange={handleChange}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700">
                                        Email
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="email"
                                            name="contact_email"
                                            id="contact_email"
                                            value={formData.contact_email}
                                            onChange={handleChange}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700">
                                        Phone
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="contact_phone"
                                            id="contact_phone"
                                            value={formData.contact_phone}
                                            onChange={handleChange}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="service_type" className="block text-sm font-medium text-gray-700">
                                        Service Type
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="service_type"
                                            id="service_type"
                                            value={formData.service_type}
                                            onChange={handleChange}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                                        Website
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="url"
                                            name="website"
                                            id="website"
                                            value={formData.website}
                                            onChange={handleChange}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-6">
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                        Notes
                                    </label>
                                    <div className="mt-1">
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            rows={3}
                                            value={formData.notes}
                                            onChange={handleChange}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${saving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* History Section */}
                <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Activity History</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <ul className="space-y-4">
                            {lead.history && lead.history.map((entry: string, index: number) => {
                                try {
                                    const h = JSON.parse(entry);
                                    return (
                                        <li key={index} className="text-sm text-gray-600 border-l-2 border-gray-200 pl-4">
                                            <span className="font-medium text-gray-900">{h.action}</span>
                                            <span className="mx-2 text-gray-400">•</span>
                                            <span>{new Date(h.ts).toLocaleString()}</span>
                                            {h.by && <span className="block text-xs text-gray-500 mt-1">By: {h.by}</span>}
                                        </li>
                                    );
                                } catch (e) {
                                    return <li key={index} className="text-sm text-gray-500">{entry}</li>;
                                }
                            })}
                            {(!lead.history || lead.history.length === 0) && (
                                <li className="text-sm text-gray-500 italic">No history available</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
