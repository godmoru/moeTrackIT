'use client';

import { useState, useEffect } from 'react';
import { retirementsApi } from '@/lib/api/expenditure.api';
import type { ExpenditureRetirement } from '@/types/expenditure.types';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/ui/DataTable';
import { toast } from 'sonner';

export default function RetirementsPage() {
    const [retirements, setRetirements] = useState<ExpenditureRetirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
    });

    useEffect(() => {
        loadRetirements();
    }, [filters]);

    const loadRetirements = async () => {
        try {
            setLoading(true);
            const response = await retirementsApi.getAll(filters);
            setRetirements(response.data.items);
        } catch (error) {
            console.error('Failed to load retirements:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'under_review':
                return 'bg-blue-100 text-blue-800';
            case 'submitted':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent"></div>
            </div>
        );
    }

    const { hasRole } = useAuth();
    const canCreate = hasRole(['super_admin', 'system_admin', 'admin', 'officer', 'principal']);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h1 className="text-lg font-semibold text-gray-900">Retirements</h1>
                {canCreate && (
                    <Link
                        href="/admin/retirements/create"
                        className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800 transition-colors text-center"
                    >
                        + Create Retirement
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-[11px]">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Search:</span>
                    <input
                        type="text"
                        placeholder="Retirement #, purpose..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 w-48"
                    />
                </div>
                <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                    <span className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Status:</span>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg bg-white shadow-sm border border-gray-100">
                <DataTable
                    data={retirements}
                    columns={[
                        {
                            header: "S/No",
                            cell: (_, index) => <span className="text-xs">{index + 1}</span>,
                        },
                        {
                            header: "Retirement #",
                            cell: (r) => (
                                <Link
                                    href={`/admin/retirements/${r.id}`}
                                    className="text-green-700 hover:underline font-medium text-xs"
                                >
                                    {r.retirementNumber}
                                </Link>
                            ),
                        },
                        {
                            header: "Purpose",
                            cell: (r) => <span className="text-xs max-w-xs truncate block">{r.purpose}</span>,
                        },
                        {
                            header: <div className="text-right">Amount (NGN)</div>,
                            cell: (r) => (
                                <div className="text-right text-xs">
                                    ₦{Number(r.amountRetired || 0).toLocaleString()}
                                </div>
                            ),
                        },
                        {
                            header: <div className="text-right">Balance (NGN)</div>,
                            cell: (r) => (
                                <div className="text-right text-xs">
                                    ₦{Number(r.balanceUnretired || 0).toLocaleString()}
                                </div>
                            ),
                        },
                        {
                            header: "Status",
                            cell: (r) => (
                                <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-full capitalize ${getStatusColor(r.status)}`}>
                                    {r.status.replace('_', ' ')}
                                </span>
                            ),
                        },
                        {
                            header: "Date",
                            cell: (r) => <span className="text-xs">{new Date(r.retirementDate).toLocaleDateString()}</span>,
                        },
                        {
                            header: <div className="text-right">Actions</div>,
                            cell: (r) => (
                                <div className="text-right">
                                    <Link
                                        href={`/admin/retirements/${r.id}`}
                                        className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            ),
                        },
                    ]}
                />
            </div>
        </div>
    );
}
