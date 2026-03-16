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
    const [activeTab, setActiveTab] = useState<"overview" | "evidence">("overview");

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
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                        Retirement Details
                    </h1>
                    {retirement.retirementNumber && (
                        <p className="text-xs text-gray-500">Number: {retirement.retirementNumber}</p>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${getStatusColor(retirement.status)}`}
                    >
                        {retirement.status.replace('_', ' ')}
                    </span>
                    <Link
                        href="/admin/retirements"
                        className="rounded-md bg-gray-100 px-3 py-1 font-medium text-gray-700 hover:bg-gray-200"
                    >
                        Back to list
                    </Link>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex gap-2 border-b border-gray-200 text-xs">
                    <button
                        type="button"
                        onClick={() => setActiveTab("overview")}
                        className={`border-b-2 px-3 py-2 font-medium ${activeTab === "overview"
                            ? "border-green-700 text-green-700"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("evidence")}
                        className={`border-b-2 px-3 py-2 font-medium ${activeTab === "evidence"
                            ? "border-green-700 text-green-700"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Evidence
                    </button>
                </div>

                {activeTab === "overview" && (
                    <div className="space-y-4 text-xs">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-lg bg-white p-4 shadow-sm md:col-span-2">
                                <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                    Retirement Information
                                </h2>
                                <dl className="grid gap-4 md:grid-cols-2">
                                    <div className="col-span-2">
                                        <dt className="text-gray-500">Purpose</dt>
                                        <dd className="font-medium text-gray-900">{retirement.purpose}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Amount Retired</dt>
                                        <dd className="font-semibold text-green-700">₦{retirement.amountRetired.toLocaleString()}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Balance Unretired</dt>
                                        <dd className="font-semibold text-gray-900">₦{retirement.balanceUnretired.toLocaleString()}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Date</dt>
                                        <dd className="font-medium text-gray-900">{new Date(retirement.retirementDate).toLocaleDateString()}</dd>
                                    </div>
                                    {retirement.remarks && (
                                        <div className="col-span-2">
                                            <dt className="text-gray-500">Remarks</dt>
                                            <dd className="font-medium text-gray-900">{retirement.remarks}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            <div className="rounded-lg bg-white p-4 shadow-sm">
                                <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                    Related Expenditure
                                </h2>
                                {retirement.expenditure ? (
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-gray-500">Reference Number</dt>
                                            <dd>
                                                <Link
                                                    href={`/admin/expenditures/${retirement.expenditure.id}`}
                                                    className="font-medium text-green-700 hover:underline"
                                                >
                                                    {retirement.expenditure.referenceNumber}
                                                </Link>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-500">Expenditure Amount</dt>
                                            <dd className="font-medium text-gray-900">₦{retirement.expenditure.amount.toLocaleString()}</dd>
                                        </div>
                                    </dl>
                                ) : (
                                    <p className="text-gray-500 italic">No linked expenditure</p>
                                )}
                            </div>
                        </div>

                        {retirement.status === 'rejected' && retirement.rejectionReason && (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                                <h3 className="text-xs font-semibold text-red-900 uppercase tracking-wide mb-2">Rejection Reason</h3>
                                <p className="text-red-800">{retirement.rejectionReason}</p>
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Actions Card */}
                            <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
                                <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                    Available Actions
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {retirement.status === 'draft' && (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={actionLoading}
                                            className="rounded-md bg-green-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                                        >
                                            {actionLoading ? 'Submitting...' : 'Submit for Review'}
                                        </button>
                                    )}

                                    {retirement.status === 'under_review' && (
                                        <>
                                            <button
                                                onClick={handleApprove}
                                                disabled={actionLoading}
                                                className="rounded-md bg-green-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={handleReject}
                                                disabled={actionLoading}
                                                className="rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Metadata Card */}
                            <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
                                <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                    Status Information
                                </h2>
                                <dl className="grid grid-cols-2 gap-3 text-[11px]">
                                    <div>
                                        <dt className="text-gray-500">Created At</dt>
                                        <dd className="font-medium text-gray-900">{new Date(retirement.createdAt).toLocaleString()}</dd>
                                    </div>
                                    {retirement.reviewedAt && (
                                        <div>
                                            <dt className="text-gray-500">Reviewed At</dt>
                                            <dd className="font-medium text-gray-900">{new Date(retirement.reviewedAt).toLocaleString()}</dd>
                                        </div>
                                    )}
                                    {retirement.approvedAt && (
                                        <div>
                                            <dt className="text-gray-500">Approved At</dt>
                                            <dd className="font-medium text-gray-900">{new Date(retirement.approvedAt).toLocaleString()}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "evidence" && (
                    <div className="space-y-4 text-xs">
                        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
                            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                Evidence Documents
                            </h2>
                            
                            {retirement.attachments && retirement.attachments.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {retirement.attachments.map((attachment: any) => (
                                        <div key={attachment.id} className="flex items-center justify-between py-2.5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-50 rounded">
                                                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-900">{attachment.fileName}</p>
                                                    <p className="text-[10px] text-gray-500 capitalize">{attachment.documentType.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => window.open(`/api/v1/attachments/retirements/attachments/${attachment.id}`, '_blank')}
                                                    className="text-[10px] text-green-700 hover:text-green-800 font-semibold border border-green-200 px-2.5 py-1 rounded hover:bg-green-50"
                                                >
                                                    View Document
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[11px] text-gray-500 italic py-4">No evidence documents uploaded yet</p>
                            )}

                            {retirement.status === 'draft' && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h3 className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Upload New Evidence</h3>
                                    <FileUpload 
                                        onUpload={handleFileUpload} 
                                        documentTypes={documentTypes}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
