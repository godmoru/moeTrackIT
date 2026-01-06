import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { expendituresApi, attachmentsApi } from '@/lib/api/expenditure.api';
import type { Expenditure } from '@/types/expenditure.types';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-gray-900">Expenditure Details</h1>
                <Link
                    href="/admin/expenditures"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    ← Back to Expenditures
                </Link>
            </div>

            {!expenditure ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Expenditure not found</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                        <table className="min-w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-3 py-2 font-medium">Reference Number</th>
                                    <th className="px-3 py-2 font-medium">Date</th>
                                    <th className="px-3 py-2 font-medium">Description</th>
                                    <th className="px-3 py-2 font-medium">Amount (NGN)</th>
                                    <th className="px-3 py-2 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t text-gray-800">
                                    <td className="px-3 py-2 text-xs">{expenditure.referenceNumber || "-"}</td>
                                    <td className="px-3 py-2 text-xs">
                                        {expenditure.date ? new Date(expenditure.date).toLocaleDateString("en-NG") : "-"}
                                    </td>
                                    <td className="px-3 py-2 text-xs">{expenditure.description || "-"}</td>
                                    <td className="px-3 py-2 text-right text-xs">
                                        ₦{Number(expenditure.amount || 0).toLocaleString("en-NG", {
                                            maximumFractionDigits: 2,
                                        })}
                                    </td>
                                    <td className="px-3 py-2 text-xs capitalize">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                                                expenditure.status === "approved"
                                                    ? "bg-green-100 text-green-700"
                                                    : expenditure.status === "rejected"
                                                    ? "bg-red-100 text-red-700"
                                                    : expenditure.status === "submitted"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                            }`}
                                        >
                                            {expenditure.status || "-"}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Actions Section */}
                    <div className="flex gap-3">
                        {expenditure.status === 'draft' && (
                            <>
                                <button
                                    onClick={handleSubmit}
                                    disabled={actionLoading}
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {actionLoading ? 'Submitting...' : 'Submit for Approval'}
                                </button>
                                <Link
                                    href={`/admin/expenditures/${expenditure.id}/edit`}
                                    className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
                                >
                                    Edit
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
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
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {actionLoading ? 'Approving...' : 'Approve'}
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={actionLoading}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {actionLoading ? 'Rejecting...' : 'Reject'}
                                </button>
                            </>
                        )}

                        {expenditure.status === 'approved' && !expenditure.retirement && (
                            <Link
                                href={`/admin/retirements/create?expenditureId=${expenditure.id}`}
                                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                            >
                                Create Retirement
                            </Link>
                        )}
                    </div>

                    {/* Additional Information */}
                    {expenditure.beneficiaryName && (
                        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                            <table className="min-w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="px-3 py-2 font-medium" colSpan={2}>Beneficiary Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-t text-gray-800">
                                        <td className="px-3 py-2 text-xs font-medium">Name</td>
                                        <td className="px-3 py-2 text-xs">{expenditure.beneficiaryName}</td>
                                    </tr>
                                    <tr className="border-t text-gray-800">
                                        <td className="px-3 py-2 text-xs font-medium">Bank</td>
                                        <td className="px-3 py-2 text-xs">{expenditure.beneficiaryBank || 'N/A'}</td>
                                    </tr>
                                    <tr className="border-t text-gray-800">
                                        <td className="px-3 py-2 text-xs font-medium">Account Number</td>
                                        <td className="px-3 py-2 text-xs">{expenditure.beneficiaryAccountNumber || 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Rejection Reason */}
                    {expenditure.status === 'rejected' && expenditure.rejectionReason && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                            <h3 className="text-sm font-semibold text-red-900 mb-2">Rejection Reason</h3>
                            <p className="text-red-800 text-sm">{expenditure.rejectionReason}</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
