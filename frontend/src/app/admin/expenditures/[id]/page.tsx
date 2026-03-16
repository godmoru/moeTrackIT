"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { expendituresApi, attachmentsApi } from '@/lib/api/expenditure.api';
import type { Expenditure } from '@/types/expenditure.types';
import FileUpload from '@/components/FileUpload';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

export default function ExpenditureDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [expenditure, setExpenditure] = useState<Expenditure | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "documents">("overview");

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
        if (!expenditure) return;

        const result = await Swal.fire({
            title: 'Submit for Approval',
            text: 'Submit this expenditure for approval?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#6b7280',
        });

        if (!result.isConfirmed) return;

        try {
            setActionLoading(true);
            await expendituresApi.submit(expenditure.id);
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Expenditure submitted for approval',
                confirmButtonColor: '#16a34a',
            });
            loadExpenditure();
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to submit expenditure',
                confirmButtonColor: '#b91c1c',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!expenditure) return;

        const result = await Swal.fire({
            title: 'Approve Expenditure',
            text: 'Approve this expenditure?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#6b7280',
        });

        if (!result.isConfirmed) return;

        try {
            setActionLoading(true);
            await expendituresApi.approve(expenditure.id);
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Expenditure approved',
                confirmButtonColor: '#16a34a',
            });
            loadExpenditure();
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to approve expenditure',
                confirmButtonColor: '#b91c1c',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!expenditure) return;

        const { value: reason } = await Swal.fire({
            title: 'Reject Expenditure',
            input: 'text',
            inputLabel: 'Rejection Reason',
            inputPlaceholder: 'Enter rejection reason...',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
        });

        if (!reason) return;

        try {
            setActionLoading(true);
            await expendituresApi.reject(expenditure.id, reason);
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Expenditure rejected',
                confirmButtonColor: '#16a34a',
            });
            loadExpenditure();
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to reject expenditure',
                confirmButtonColor: '#b91c1c',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!expenditure) return;

        const result = await Swal.fire({
            title: 'Delete Expenditure',
            text: 'Delete this expenditure? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
        });

        if (!result.isConfirmed) return;

        try {
            await expendituresApi.delete(expenditure.id);
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Expenditure deleted',
                confirmButtonColor: '#16a34a',
            });
            router.push('/admin/expenditures');
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to delete expenditure',
                confirmButtonColor: '#b91c1c',
            });
        }
    };

    const handleFileUpload = async (file: File, documentType: string) => {
        if (!expenditure) return;

        try {
            setActionLoading(true);
            await attachmentsApi.uploadExpenditure(expenditure.id, file, documentType);
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'File uploaded successfully',
                timer: 2000,
                showConfirmButton: false,
            });
            loadExpenditure();
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to upload file',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const documentTypes = [
        { value: 'approval_memo', label: 'Approval Memo' },
        { value: 'contract', label: 'Contract Document' },
        { value: 'invoice', label: 'Pro-forma Invoice' },
        { value: 'other', label: 'Other Document' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                        Expenditure Details
                    </h1>
                    {expenditure?.referenceNumber && (
                        <p className="text-xs text-gray-500">Ref: {expenditure.referenceNumber}</p>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    {expenditure && (
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${expenditure.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : expenditure.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : expenditure.status === "submitted"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-yellow-100 text-yellow-800"
                                }`}
                        >
                            {expenditure.status}
                        </span>
                    )}
                    <Link
                        href="/admin/expenditures"
                        className="rounded-md bg-gray-100 px-3 py-1 font-medium text-gray-700 hover:bg-gray-200"
                    >
                        Back to list
                    </Link>
                </div>
            </div>

            {!expenditure ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Expenditure not found</p>
                </div>
            ) : (
                <>
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
                            onClick={() => setActiveTab("documents")}
                            className={`border-b-2 px-3 py-2 font-medium ${activeTab === "documents"
                                ? "border-green-700 text-green-700"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Documents
                        </button>
                    </div>

                    {activeTab === "overview" && (
                        <div className="space-y-4 text-xs">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-lg bg-white p-4 shadow-sm md:col-span-2">
                                    <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                        Main Information
                                    </h2>
                                    <dl className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <dt className="text-gray-500">Description</dt>
                                            <dd className="font-medium text-gray-900">{expenditure.description || "-"}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-500">Reference Number</dt>
                                            <dd className="font-medium text-gray-900">{expenditure.referenceNumber || "-"}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-500">Amount</dt>
                                            <dd className="font-semibold text-green-700">
                                                ₦{Number(expenditure.amount || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-500">Date</dt>
                                            <dd className="font-medium text-gray-900">
                                                {expenditure.date ? new Date(expenditure.date).toLocaleDateString("en-NG") : "-"}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-500">Status</dt>
                                            <dd className="capitalize font-medium text-gray-900">{expenditure.status}</dd>
                                        </div>
                                        {expenditure.expenditureCategory && (
                                            <div>
                                                <dt className="text-gray-500">Category</dt>
                                                <dd className="font-medium text-gray-900">{expenditure.expenditureCategory.cat_name}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                <div className="rounded-lg bg-white p-4 shadow-sm">
                                    <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                        Beneficiary Details
                                    </h2>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-gray-500">Name</dt>
                                            <dd className="font-medium text-gray-900">{expenditure.beneficiaryName || "N/A"}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-500">Bank</dt>
                                            <dd className="font-medium text-gray-900">{expenditure.beneficiaryBank || "N/A"}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-500">Account Number</dt>
                                            <dd className="font-medium text-gray-900">{expenditure.beneficiaryAccountNumber || "N/A"}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {expenditure.status === 'rejected' && expenditure.rejectionReason && (
                                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                                    <h3 className="text-xs font-semibold text-red-900 uppercase tracking-wide mb-2">Rejection Reason</h3>
                                    <p className="text-red-800">{expenditure.rejectionReason}</p>
                                </div>
                            )}

                            {/* Actions Card */}
                            <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
                                <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                    Available Actions
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {expenditure.status === 'draft' && (
                                        <>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={actionLoading}
                                                className="rounded-md bg-green-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                                            >
                                                {actionLoading ? 'Submitting...' : 'Submit for Approval'}
                                            </button>
                                            <Link
                                                href={`/admin/expenditures/${expenditure.id}/edit`}
                                                className="rounded-md bg-blue-100 px-3 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-200"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={handleDelete}
                                                className="rounded-md bg-red-100 px-3 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-200"
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
                                                className="rounded-md bg-green-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={handleReject}
                                                disabled={actionLoading}
                                                className="rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}

                                    {expenditure.status === 'approved' && !expenditure.retirement && (
                                        <Link
                                            href={`/admin/retirements/create?expenditureId=${expenditure.id}`}
                                            className="rounded-md bg-green-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-green-800"
                                        >
                                            Create Retirement
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "documents" && (
                        <div className="space-y-4 text-xs">
                            <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
                                <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                    Approval Documents
                                </h2>
                                
                                {expenditure.attachments && expenditure.attachments.length > 0 ? (
                                    <div className="divide-y divide-gray-100">
                                        {expenditure.attachments.map((attachment: any) => (
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
                                                        onClick={() => window.open(`${API_BASE}/attachments/${attachment.id}`, '_blank')}
                                                        className="text-[10px] text-green-700 hover:text-green-800 font-semibold border border-green-200 px-2.5 py-1 rounded hover:bg-green-50"
                                                    >
                                                        View Document
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-gray-500 italic py-4">No documents uploaded yet</p>
                                )}

                                {expenditure.status === 'draft' && (
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Upload New Document</h3>
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
                </>
            )}
        </div>
    );
}
