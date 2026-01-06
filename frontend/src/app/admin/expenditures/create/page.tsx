'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { expendituresApi, budgetLineItemsApi } from '@/lib/api/expenditure.api';
import type { BudgetLineItem } from '@/types/expenditure.types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

export default function CreateExpenditurePage() {
    const router = useRouter();
    const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);
    const [selectedLineItem, setSelectedLineItem] = useState<BudgetLineItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        budgetLineItemId: '',
        amount: '',
        description: '',
        beneficiaryName: '',
        beneficiaryAccountNumber: '',
        beneficiaryBank: '',
        paymentVoucherNumber: '',
    });

    useEffect(() => {
        loadLineItems();
    }, []);

    const loadLineItems = async () => {
        try {
            const response = await budgetLineItemsApi.getAll({ limit: 100 });
            setLineItems(response.data.items);
        } catch (error) {
            console.error('Failed to load line items:', error);
        }
    };

    const handleLineItemChange = (lineItemId: string) => {
        setFormData({ ...formData, budgetLineItemId: lineItemId });
        const lineItem = lineItems.find((item) => item.id === parseInt(lineItemId));
        setSelectedLineItem(lineItem || null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedLineItem) {
            await Swal.fire({
                icon: "error",
                title: "Missing Budget Line Item",
                text: "Please select a budget line item",
                confirmButtonColor: "#b91c1c",
            });
            return;
        }

        const amount = parseFloat(formData.amount);
        if (amount > selectedLineItem.balance) {
            await Swal.fire({
                icon: "error",
                title: "Insufficient Balance",
                text: `Amount exceeds available balance of ₦${selectedLineItem.balance.toLocaleString()}`,
                confirmButtonColor: "#b91c1c",
            });
            return;
        }

        try {
            setLoading(true);
            await expendituresApi.create({
                ...formData,
                budgetLineItemId: parseInt(formData.budgetLineItemId),
                amount,
                mdaId: selectedLineItem.mdaId,
            });
            await Swal.fire({
                icon: "success",
                title: "Success",
                text: "Expenditure created successfully",
                confirmButtonColor: "#16a34a",
            });
            router.push('/admin/expenditures');
        } catch (error: any) {
            console.error('Failed to create expenditure:', error);
            await Swal.fire({
                icon: "error",
                title: "Error",
                text: error.response?.data?.message || 'Failed to create expenditure',
                confirmButtonColor: "#b91c1c",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-gray-900">Create Expenditure</h1>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    ← Back
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                <form onSubmit={handleSubmit} className="min-w-full divide-y divide-gray-200">
                    <div className="p-4 space-y-4">
                        {/* Budget Line Item Selection */}
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">
                                Budget Line Item <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.budgetLineItemId}
                                onChange={(e) => handleLineItemChange(e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                                required
                            >
                                <option value="">Select a budget line item</option>
                                {lineItems.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.code} - {item.name} (Balance: ₦{item.balance.toLocaleString()})
                                    </option>
                                ))}
                            </select>
                            {selectedLineItem && (
                                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-gray-600">Category:</span>
                                            <span className="ml-2 font-medium capitalize">{selectedLineItem.category}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Available Balance:</span>
                                            <span className="ml-2 font-medium text-green-600">
                                                ₦{selectedLineItem.balance.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Amount */}
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">
                                Amount <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500 text-xs">₦</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full rounded-md border border-gray-300 pl-8 pr-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                                rows={3}
                                placeholder="Enter expenditure description..."
                                required
                            />
                        </div>
                    </div>

                    {/* Beneficiary Details */}
                    <div className="border-t border-gray-200 p-4 space-y-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Beneficiary Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-700">
                                    Beneficiary Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.beneficiaryName}
                                    onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                                    placeholder="Enter beneficiary name"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-700">
                                    Bank
                                </label>
                                <input
                                    type="text"
                                    value={formData.beneficiaryBank}
                                    onChange={(e) => setFormData({ ...formData, beneficiaryBank: e.target.value })}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                                    placeholder="Enter bank name"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-700">
                                    Account Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.beneficiaryAccountNumber}
                                    onChange={(e) => setFormData({ ...formData, beneficiaryAccountNumber: e.target.value })}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                                    placeholder="Enter account number"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-700">
                                    Payment Voucher Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.paymentVoucherNumber}
                                    onChange={(e) => setFormData({ ...formData, paymentVoucherNumber: e.target.value })}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                                    placeholder="Enter voucher number"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 p-4 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Expenditure'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
