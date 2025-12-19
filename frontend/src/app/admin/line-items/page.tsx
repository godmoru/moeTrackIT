'use client';

import { useState, useEffect } from 'react';
import { budgetLineItemsApi } from '@/lib/api/expenditure.api';
import type { BudgetLineItem } from '@/types/expenditure.types';
import Link from 'next/link';

export default function BudgetLineItemsPage() {
    const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: '',
        fiscalYear: new Date().getFullYear(),
    });

    useEffect(() => {
        loadLineItems();
    }, [filters]);

    const loadLineItems = async () => {
        try {
            setLoading(true);
            const response = await budgetLineItemsApi.getAll(filters);
            setLineItems(response.data.items);
        } catch (error) {
            console.error('Failed to load line items:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'personnel': return 'bg-blue-100 text-blue-800';
            case 'overhead': return 'bg-purple-100 text-purple-800';
            case 'recurrent': return 'bg-yellow-100 text-yellow-800';
            case 'capital': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getUtilizationColor = (percentage: number) => {
        if (percentage >= 95) return 'text-red-600';
        if (percentage >= 85) return 'text-orange-600';
        if (percentage >= 75) return 'text-yellow-600';
        return 'text-green-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Budget Line Items</h1>
                <Link
                    href="/admin/line-items/create"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                    + Create Line Item
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fiscal Year
                        </label>
                        <select
                            value={filters.fiscalYear}
                            onChange={(e) => setFilters({ ...filters, fiscalYear: parseInt(e.target.value) })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            {[2024, 2025, 2026].map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                        </label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="">All Categories</option>
                            <option value="personnel">Personnel</option>
                            <option value="overhead">Overhead</option>
                            <option value="recurrent">Recurrent</option>
                            <option value="capital">Capital</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Balance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Utilization
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {lineItems.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    No budget line items found.
                                </td>
                            </tr>
                        ) : (
                            lineItems.map((item) => {
                                const utilization = ((item.amount - item.balance) / item.amount) * 100;
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.code}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="max-w-xs truncate">{item.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getCategoryColor(item.category)}`}>
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ₦{item.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ₦{item.balance.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                    <div
                                                        className={`h-2 rounded-full ${utilization >= 95 ? 'bg-red-600' :
                                                                utilization >= 85 ? 'bg-orange-600' :
                                                                    utilization >= 75 ? 'bg-yellow-600' :
                                                                        'bg-green-600'
                                                            }`}
                                                        style={{ width: `${Math.min(utilization, 100)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-sm font-medium ${getUtilizationColor(utilization)}`}>
                                                    {utilization.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Link
                                                href={`/admin/line-items/${item.id}`}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
