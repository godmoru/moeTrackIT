'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { retirementsApi, expendituresApi, attachmentsApi } from '@/lib/api/expenditure.api';
import type { Expenditure } from '@/types/expenditure.types';
import FileUpload from '@/components/FileUpload';

function CreateRetirementForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const expenditureId = searchParams.get('expenditureId');

    const [expenditure, setExpenditure] = useState<Expenditure | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        expenditureId: expenditureId || '',
        amountRetired: '',
        purpose: '',
        remarks: '',
    });

    useEffect(() => {
        if (expenditureId) {
            loadExpenditure(expenditureId);
        }
    }, [expenditureId]);

    const loadExpenditure = async (id: string) => {
        try {
            const response = await expendituresApi.getById(id);
            setExpenditure(response.data.data.expenditure);
            setFormData({ ...formData, expenditureId: id });
        } catch (error) {
            console.error('Failed to load expenditure:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!expenditure) {
            alert('Please select an expenditure');
            return;
        }

        const amount = parseFloat(formData.amountRetired);
        if (amount > expenditure.amount) {
            alert(`Amount retired cannot exceed expenditure amount of ₦${expenditure.amount.toLocaleString()}`);
            return;
        }

        try {
            setLoading(true);
            const response = await retirementsApi.create({
                ...formData,
                amountRetired: amount,
            });

            const retirementId = response.data.data.retirement.id;
            router.push(`/admin/retirements/${retirementId}`);
        } catch (error: any) {
            console.error('Failed to create retirement:', error);
            alert(error.response?.data?.message || 'Failed to create retirement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Create Expenditure Retirement</h1>
                <p className="text-gray-600 mt-1">Retire an approved expenditure with evidence</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                {/* Expenditure Info */}
                {expenditure && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Expenditure Details</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-600">Reference:</span>
                                <span className="ml-2 font-medium">{expenditure.referenceNumber}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Amount:</span>
                                <span className="ml-2 font-medium">₦{expenditure.amount.toLocaleString()}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-gray-600">Description:</span>
                                <span className="ml-2">{expenditure.description}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Amount Retired */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount Retired <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">₦</span>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.amountRetired}
                            onChange={(e) => setFormData({ ...formData, amountRetired: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="0.00"
                            required
                        />
                    </div>
                    {expenditure && (
                        <p className="mt-1 text-sm text-gray-500">
                            Maximum: ₦{expenditure.amount.toLocaleString()}
                        </p>
                    )}
                </div>

                {/* Purpose */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purpose <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={3}
                        placeholder="Describe the purpose of this retirement..."
                        required
                    />
                </div>

                {/* Remarks */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remarks (Optional)
                    </label>
                    <textarea
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={2}
                        placeholder="Additional remarks..."
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-6 border-t">
                    <button
                        type="submit"
                        disabled={loading || !expenditure}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating...' : 'Create Retirement'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>

            {/* Note about attachments */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> After creating the retirement, you'll be able to upload evidence documents (receipts, invoices, etc.) on the retirement detail page.
                </p>
            </div>
        </div>
    );
}

export default function CreateRetirementPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent"></div>
            </div>
        }>
            <CreateRetirementForm />
        </Suspense>
    );
}
