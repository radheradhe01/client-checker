import { Models } from 'appwrite';

interface LeadCardProps {
    lead: {
        $id: string;
        frn: string;
        company_name: string;
        contact_email?: string;
        contact_phone?: string;
        service_type?: string;
        website?: string;
        pipelineStatus?: string;
    };
    onClaim?: (leadId: string) => void;
    showClaimButton?: boolean;
    claiming?: boolean;
}

export default function LeadCard({ lead, onClaim, showClaimButton = false, claiming = false }: LeadCardProps) {
    const statusColors: Record<string, string> = {
        'Unassigned': 'bg-gray-100 text-gray-800',
        'Email Sent': 'bg-blue-100 text-blue-800',
        'Client Replied': 'bg-green-100 text-green-800',
        'Plan Sent': 'bg-yellow-100 text-yellow-800',
        'Rate Finalized': 'bg-purple-100 text-purple-800',
        'Docs Signed': 'bg-indigo-100 text-indigo-800',
        'Testing': 'bg-orange-100 text-orange-800',
        'Approved': 'bg-green-200 text-green-900',
        'Rejected': 'bg-red-100 text-red-800',
    };

    const statusColor = lead.pipelineStatus
        ? statusColors[lead.pipelineStatus] || 'bg-gray-100 text-gray-800'
        : 'bg-gray-100 text-gray-800';

    return (
        <div className="bg-white shadow rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{lead.company_name}</h3>
                {lead.pipelineStatus && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                        {lead.pipelineStatus}
                    </span>
                )}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
                <div>
                    <span className="font-medium">FRN:</span> {lead.frn}
                </div>
                {lead.contact_email && (
                    <div>
                        <span className="font-medium">Email:</span>{' '}
                        <a href={`mailto:${lead.contact_email}`} className="text-indigo-600 hover:text-indigo-800">
                            {lead.contact_email}
                        </a>
                    </div>
                )}
                {lead.contact_phone && (
                    <div>
                        <span className="font-medium">Phone:</span> {lead.contact_phone}
                    </div>
                )}
                {lead.service_type && (
                    <div>
                        <span className="font-medium">Service:</span> {lead.service_type}
                    </div>
                )}
                {lead.website && (
                    <div>
                        <span className="font-medium">Website:</span>{' '}
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                            {lead.website}
                        </a>
                    </div>
                )}
            </div>

            {showClaimButton && onClaim && (
                <button
                    onClick={() => onClaim(lead.$id)}
                    disabled={claiming}
                    className={`mt-4 w-full py-2 px-4 rounded-md font-medium transition-colors ${claiming
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                >
                    {claiming ? 'Claiming...' : 'Claim Lead'}
                </button>
            )}
        </div>
    );
}
