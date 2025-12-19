'use client';

import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api/expenditure.api';
import type { EarlyWarning } from '@/types/expenditure.types';

export default function EarlyWarningsWidget() {
    const [warnings, setWarnings] = useState<EarlyWarning[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWarnings();
    }, []);

    const loadWarnings = async () => {
        try {
            const response = await dashboardApi.getEarlyWarnings();
            setWarnings(response.data.data.warnings);
        } catch (error) {
            console.error('Failed to load warnings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getWarningIcon = (level: string) => {
        switch (level) {
            case 'critical':
                return '🚨';
            case 'high':
                return '🔶';
            case 'medium':
                return '⚠️';
            default:
                return 'ℹ️';
        }
    };

    const getWarningColor = (level: string) => {
        switch (level) {
            case 'critical':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'high':
                return 'bg-orange-50 border-orange-200 text-orange-800';
            case 'medium':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            default:
                return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Budget Warnings</h2>
                {warnings.length > 0 && (
                    <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {warnings.length}
                    </span>
                )}
            </div>

            {warnings.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-gray-500 text-sm">All budgets are within safe limits</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {warnings.map((warning, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg border ${getWarningColor(warning.level)}`}
                        >
                            <div className="flex items-start">
                                <span className="text-2xl mr-3">{getWarningIcon(warning.level)}</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-medium text-sm">{warning.lineItemName}</h3>
                                        <span className="text-xs font-semibold">
                                            {warning.utilizationPercentage.toFixed(1)}%
                                        </span>
                                    </div>
                                    <p className="text-xs opacity-90 mb-2">
                                        {warning.lineItemCode} • {warning.mdaName}
                                    </p>
                                    <div className="flex items-center justify-between text-xs">
                                        <span>Balance: ₦{warning.balance.toLocaleString()}</span>
                                        <span className="font-semibold capitalize">{warning.level} Alert</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
