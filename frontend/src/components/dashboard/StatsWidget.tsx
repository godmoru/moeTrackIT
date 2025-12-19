'use client';

import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api/expenditure.api';

interface StatsWidgetProps {
    title: string;
    type: 'expenditure' | 'retirement';
}

export default function StatsWidget({ title, type }: StatsWidgetProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [type]);

    const loadStats = async () => {
        try {
            const response = type === 'expenditure'
                ? await dashboardApi.getExpenditureSummary()
                : await dashboardApi.getRetirementStatus();
            setStats(response.data.data.stats);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const cards = type === 'expenditure' ? [
        { label: 'Total Expenditures', value: stats.totalExpenditures, color: 'blue' },
        { label: 'Approved', value: stats.approvedExpenditures, color: 'green' },
        { label: 'Pending', value: stats.pendingExpenditures, color: 'yellow' },
        { label: 'Total Amount', value: `₦${stats.totalAmount?.toLocaleString() || 0}`, color: 'purple' },
    ] : [
        { label: 'Total Retirements', value: stats.totalRetirements, color: 'blue' },
        { label: 'Approved', value: stats.approvedRetirements, color: 'green' },
        { label: 'Pending', value: stats.pendingRetirements, color: 'yellow' },
        { label: 'Amount Retired', value: `₦${stats.totalAmountRetired?.toLocaleString() || 0}`, color: 'purple' },
    ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, string> = {
            blue: 'bg-blue-50 text-blue-700',
            green: 'bg-green-50 text-green-700',
            yellow: 'bg-yellow-50 text-yellow-700',
            purple: 'bg-purple-50 text-purple-700',
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
            <div className="grid grid-cols-2 gap-4">
                {cards.map((card, index) => (
                    <div key={index} className={`p-4 rounded-lg ${getColorClasses(card.color)}`}>
                        <p className="text-sm opacity-80 mb-1">{card.label}</p>
                        <p className="text-2xl font-bold">{card.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
