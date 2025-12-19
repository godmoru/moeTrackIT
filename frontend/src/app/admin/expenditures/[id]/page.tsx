'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { expendituresApi, attachmentsApi } from '@/lib/api/expenditure.api';
import type { Expenditure } from '@/types/expenditure.types';
import Link from 'next/link';

export default function ExpenditureDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [expenditure, setExpenditure] = useState<Expenditure | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (params.id) {
            loadExpenditure();
        }
    }, [params.id]);

    const loadExpenditure = async () => {
        try {
            const response = await expendituresApi.getById(params.id as string);
            setExpenditure(response.data.data.expenditure);
        } catch (error) {
            console.error('Failed to load expenditure:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!expenditure || !confirm('Submit this expenditure for approval?')) return;

        try {
            setActionLoading(true);
            await expendituresApi.submit(expenditure.id);
            loadExpenditure();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to submit expenditure');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!expenditure || !confirm('Approve this expenditure?')) return;

        try {
            setActionLoading(true);
            await expendituresApi.approve(expenditure.id);
            loadExpenditure();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to approve expenditure');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!expenditure) return;

        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            setActionLoading(true);
            await expendituresApi.reject(expenditure.id, reason);
            loadExpenditure();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to reject expenditure');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!expenditure || !confirm('Delete this expenditure? This action cannot be undone.')) return;

        try {
            await expendituresApi.delete(expenditure.id);
            router.push('/admin/expenditures');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to delete expenditure');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent"></div>
            </div>
        );
    }

    if (!expenditure) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-gray-500">Expenditure not found</p>
                    <Link href="/admin/expenditures" className="text-green-600 hover:text-green-700 mt-4 inline-block">
                        Back to Expenditures
                    </Link>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'submitted': return 'bg-blue-100 text-blue-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link href="/admin/expenditures" className="text-green-600 hover:text-green-700 text-sm mb-2 inline-block">
                    ← Back to Expenditures
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{expenditure.referenceNumber}</h1>
                        <p className="text-gray-600 mt-1">Expenditure Details</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(expenditure.status)}`}>
                        {expenditure.status}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Amount</p>
                                <p className="text-lg font-semibold text-gray-900">₦{expenditure.amount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Date</p>
                                <p className="text-gray-900">{new Date(expenditure.date).toLocaleDateString()}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-gray-600">Description</p>
                                <p className="text-gray-900">{expenditure.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Beneficiary Details */}
                    {expenditure.beneficiaryName && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Beneficiary Details</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Name</p>
                                    <p className="text-gray-900">{expenditure.beneficiaryName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Bank</p>
                                    <p className="text-gray-900">{expenditure.beneficiaryBank || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Account Number</p>
                                    <p className="text-gray-900">{expenditure.beneficiaryAccountNumber || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rejection Reason */}
                    {expenditure.status === 'rejected' && expenditure.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-red-900 mb-2">Rejection Reason</h3>
                            <p className="text-red-800">{expenditure.rejectionReason}</p>
                        </div>
                    )}

                    {/* Attachments */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h2>
                        {expenditure.attachments && expenditure.attachments.length > 0 ? (
                            <div className="space-y-2">
                                {expenditure.attachments.map((attachment) => (
                                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <div>
                                            <p className="font-medium text-gray-900">{attachment.fileName}</p>
                                            <p className="text-sm text-gray-600">{attachment.documentType}</p>
                                        </div>
                                        <button
                                            onClick={() => window.open(`/api/v1/attachments/${attachment.id}`, '_blank')}
                                            className="text-green-600 hover:text-green-700 text-sm"
                                        >
                                            Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No attachments</p>
                        )}
                    </div>
                </div>

                {/* Right Column - Actions & Info */}
                <div className="space-y-6">
                    {/* Actions */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                        <div className="space-y-2">
                            {expenditure.status === 'draft' && (
                                <>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={actionLoading}
                                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                                    >
                                        Submit for Approval
                                    </button>
                                    <Link
                                        href={`/admin/expenditures/${expenditure.id}/edit`}
                                        className="block w-full text-center bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </>
                            )}

                            {expenditure.status === 'submitted' && (
                                <>
                                    <button
                                        onClick={handleApprove}
                                        disabled={actionLoading}
                                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={actionLoading}
                                        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}

                            {expenditure.status === 'approved' && !expenditure.retirement && (
                                <Link
                                    href={`/admin/retirements/create?expenditureId=${expenditure.id}`}
                                    className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Create Retirement
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Information</h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-gray-600">Created</p>
                                <p className="text-gray-900">{new Date(expenditure.createdAt).toLocaleString()}</p>
                            </div>
                            {expenditure.approvedAt && (
                                <div>
                                    <p className="text-gray-600">Approved</p>
                                    <p className="text-gray-900">{new Date(expenditure.approvedAt).toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
