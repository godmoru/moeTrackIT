'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { retirementsApi, attachmentsApi } from '@/lib/api/expenditure.api';
import type { ExpenditureRetirement } from '@/types/expenditure.types';
import FileUpload from '@/components/FileUpload';
import Link from 'next/link';

export default function RetirementDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [retirement, setRetirement] = useState<ExpenditureRetirement | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (params.id) {
            loadRetirement();
        }
    }, [params.id]);

    const loadRetirement = async () => {
        try {
            const response = await retirementsApi.getById(params.id as string);
            setRetirement(response.data.data.retirement);
        } catch (error) {
            console.error('Failed to load retirement:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File, documentType: string, description?: string) => {
        if (!retirement) return;

        try {
            await attachmentsApi.uploadRetirement(retirement.id, file, documentType, description);
            loadRetirement(); // Reload to show new attachment
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to upload file');
        }
    };

    const handleSubmit = async () => {
        if (!retirement || !confirm('Submit this retirement for review?')) return;

        try {
            setActionLoading(true);
            await retirementsApi.submit(retirement.id);
            loadRetirement();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to submit retirement');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!retirement || !confirm('Approve this retirement?')) return;

        try {
            setActionLoading(true);
            await retirementsApi.approve(retirement.id);
            loadRetirement();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to approve retirement');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!retirement) return;

        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            setActionLoading(true);
            await retirementsApi.reject(retirement.id, reason);
            loadRetirement();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to reject retirement');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent"></div>
            </div>
        );
    }

    if (!retirement) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-gray-500">Retirement not found</p>
                    <Link href="/admin/retirements" className="text-green-600 hover:text-green-700 mt-4 inline-block">
                        Back to Retirements
                    </Link>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'under_review': return 'bg-blue-100 text-blue-800';
            case 'submitted': return 'bg-purple-100 text-purple-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    const documentTypes = [
        { value: 'receipt', label: 'Receipt' },
        { value: 'invoice', label: 'Invoice' },
        { value: 'delivery_note', label: 'Delivery Note' },
        { value: 'payment_proof', label: 'Payment Proof' },
        { value: 'other', label: 'Other' },
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link href="/admin/retirements" className="text-green-600 hover:text-green-700 text-sm mb-2 inline-block">
                    ← Back to Retirements
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{retirement.retirementNumber}</h1>
                        <p className="text-gray-600 mt-1">Retirement Details</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(retirement.status)}`}>
                        {retirement.status.replace('_', ' ')}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Retirement Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Amount Retired</p>
                                <p className="text-lg font-semibold text-gray-900">₦{retirement.amountRetired.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Balance Unretired</p>
                                <p className="text-lg font-semibold text-gray-900">₦{retirement.balanceUnretired.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Retirement Date</p>
                                <p className="text-gray-900">{new Date(retirement.retirementDate).toLocaleDateString()}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-gray-600">Purpose</p>
                                <p className="text-gray-900">{retirement.purpose}</p>
                            </div>
                            {retirement.remarks && (
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-600">Remarks</p>
                                    <p className="text-gray-900">{retirement.remarks}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expenditure Details */}
                    {retirement.expenditure && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Expenditure</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Reference Number</p>
                                    <Link
                                        href={`/admin/expenditures/${retirement.expenditure.id}`}
                                        className="text-green-600 hover:text-green-700"
                                    >
                                        {retirement.expenditure.referenceNumber}
                                    </Link>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Expenditure Amount</p>
                                    <p className="text-gray-900">₦{retirement.expenditure.amount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rejection Reason */}
                    {retirement.status === 'rejected' && retirement.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-red-900 mb-2">Rejection Reason</h3>
                            <p className="text-red-800">{retirement.rejectionReason}</p>
                        </div>
                    )}

                    {/* Attachments */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Evidence Documents</h2>
                        {retirement.attachments && retirement.attachments.length > 0 ? (
                            <div className="space-y-2 mb-4">
                                {retirement.attachments.map((attachment) => (
                                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <div>
                                            <p className="font-medium text-gray-900">{attachment.fileName}</p>
                                            <p className="text-sm text-gray-600 capitalize">{attachment.documentType.replace('_', ' ')}</p>
                                        </div>
                                        <button
                                            onClick={() => window.open(`/api/v1/attachments/retirements/attachments/${attachment.id}`, '_blank')}
                                            className="text-green-600 hover:text-green-700 text-sm"
                                        >
                                            Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm mb-4">No evidence documents uploaded yet</p>
                        )}

                        {/* File Upload - Only for draft status */}
                        {retirement.status === 'draft' && (
                            <FileUpload
                                onUpload={handleFileUpload}
                                documentTypes={documentTypes}
                            />
                        )}
                    </div>
                </div>

                {/* Right Column - Actions & Info */}
                <div className="space-y-6">
                    {/* Actions */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                        <div className="space-y-2">
                            {retirement.status === 'draft' && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={actionLoading}
                                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                                >
                                    Submit for Review
                                </button>
                            )}

                            {retirement.status === 'under_review' && (
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
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Information</h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-gray-600">Created</p>
                                <p className="text-gray-900">{new Date(retirement.createdAt).toLocaleString()}</p>
                            </div>
                            {retirement.reviewedAt && (
                                <div>
                                    <p className="text-gray-600">Reviewed</p>
                                    <p className="text-gray-900">{new Date(retirement.reviewedAt).toLocaleString()}</p>
                                </div>
                            )}
                            {retirement.approvedAt && (
                                <div>
                                    <p className="text-gray-600">Approved</p>
                                    <p className="text-gray-900">{new Date(retirement.approvedAt).toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
