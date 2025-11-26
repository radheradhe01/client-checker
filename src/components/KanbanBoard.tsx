'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { client, databases, account } from '@/lib/appwrite/client';
import { APPWRITE_DATABASE_ID, APPWRITE_LEADS_COLLECTION_ID } from '@/lib/appwrite/config';
import { Query } from 'appwrite';
import LeadCard from './LeadCard';

const COLUMNS = [
    'Email Sent',
    'Client Replied',
    'Plan Sent',
    'Rate Finalized',
    'Docs Signed',
    'Testing',
    'Approved',
    'Rejected'
];

interface Lead {
    $id: string;
    frn: string;
    company_name: string;
    contact_email?: string;
    contact_phone?: string;
    service_type?: string;
    website?: string;
    pipelineStatus: string;
    assignedEmployeeId: string;
}

export default function KanbanBoard() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const user = await account.get();
                setUserId(user.$id);
                fetchLeads(user.$id);
            } catch (error) {
                console.error('Auth error', error);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (!userId) return;

        const unsubscribe = client.subscribe(
            `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_LEADS_COLLECTION_ID}.documents`,
            (response) => {
                const event = response.events[0];
                const payload = response.payload as Lead;

                // Only care about leads assigned to me
                if (payload.assignedEmployeeId !== userId) return;

                if (event.includes('.update')) {
                    setLeads((prev) => {
                        const exists = prev.find((l) => l.$id === payload.$id);
                        if (exists) return prev.map((l) => (l.$id === payload.$id ? payload : l));
                        return [payload, ...prev];
                    });
                } else if (event.includes('.create')) {
                    setLeads((prev) => [payload, ...prev]);
                } else if (event.includes('.delete')) {
                    setLeads((prev) => prev.filter((l) => l.$id !== payload.$id));
                }
            }
        );

        return () => {
            unsubscribe();
        };
    }, [userId]);

    const fetchLeads = async (uid: string) => {
        try {
            const res = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                APPWRITE_LEADS_COLLECTION_ID,
                [
                    Query.equal('assignedEmployeeId', uid),
                    Query.limit(100), // Adjust limit as needed
                ]
            );
            setLeads(res.documents as unknown as Lead[]);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStatus = destination.droppableId;

        // Optimistic Update
        const updatedLeads = leads.map(lead => {
            if (lead.$id === draggableId) {
                return { ...lead, pipelineStatus: newStatus };
            }
            return lead;
        });

        setLeads(updatedLeads);

        try {
            await fetch(`/api/leads/${draggableId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pipelineStatus: newStatus }),
            });
        } catch (error) {
            console.error('Failed to update status', error);
            // Rollback
            fetchLeads(userId!);
            alert('Failed to move lead. Please try again.');
        }
    };

    if (loading) return <div>Loading board...</div>;

    return (
        <div className="h-full overflow-x-auto pb-4">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex space-x-4 min-w-max">
                    {COLUMNS.map((columnId) => {
                        const columnLeads = leads.filter((l) => l.pipelineStatus === columnId);
                        return (
                            <div key={columnId} className="w-80 flex-shrink-0 bg-gray-100 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-4 flex justify-between items-center">
                                    {columnId}
                                    <span className="bg-gray-200 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                                        {columnLeads.length}
                                    </span>
                                </h3>
                                <Droppable droppableId={columnId}>
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="space-y-3 min-h-[200px]"
                                        >
                                            {columnLeads.map((lead, index) => (
                                                <Draggable key={lead.$id} draggableId={lead.$id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                        >
                                                            <LeadCard lead={lead as any} />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}
