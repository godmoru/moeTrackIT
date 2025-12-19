'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { expendituresApi, budgetLineItemsApi } from '@/lib/api/expenditure.api';
import type { BudgetLineItem } from '@/types/expenditure.types';

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
            alert('Please select a budget line item');
            return;
        }

        const amount = parseFloat(formData.amount);
        if (amount > selectedLineItem.balance) {
            alert(`Amount exceeds available balance of ₦${selectedLineItem.balance.toLocaleString()}`);
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
            router.push('/admin/expenditures');
        } catch (error: any) {
            console.error('Failed to create expenditure:', error);
            alert(error.response?.data?.message || 'Failed to create expenditure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Create Expenditure</h1>
                <p className="text-gray-600 mt-1">Record a new expenditure from a budget line item</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                {/* Budget Line Item Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Budget Line Item <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.budgetLineItemId}
                        onChange={(e) => handleLineItemChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                            <div className="grid grid-cols-2 gap-2 text-sm">
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
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">₦</span>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="0.00"
                            required
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={3}
                        placeholder="Enter expenditure description..."
                        required
                    />
                </div>

                {/* Beneficiary Details */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Beneficiary Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Beneficiary Name
                            </label>
                            <input
                                type="text"
                                value={formData.beneficiaryName}
                                onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Enter beneficiary name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bank
                            </label>
                            <input
                                type="text"
                                value={formData.beneficiaryBank}
                                onChange={(e) => setFormData({ ...formData, beneficiaryBank: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Enter bank name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Number
                            </label>
                            <input
                                type="text"
                                value={formData.beneficiaryAccountNumber}
                                onChange={(e) => setFormData({ ...formData, beneficiaryAccountNumber: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Enter account number"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Voucher Number
                            </label>
                            <input
                                type="text"
                                value={formData.paymentVoucherNumber}
                                onChange={(e) => setFormData({ ...formData, paymentVoucherNumber: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Enter voucher number"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-6 border-t">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating...' : 'Create Expenditure'}
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
        </div>
    );
}
