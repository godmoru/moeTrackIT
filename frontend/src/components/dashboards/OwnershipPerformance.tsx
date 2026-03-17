"use client";

import { useEffect, useState } from "react";
import { RevenueBySourcePie } from "@/components/Charts";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface OwnershipItem {
  ownership: string;
  totalAmount: number;
  schoolCount: number;
}

interface OwnershipPerformanceProps {
  lga?: string;
  lgaId?: number;
  from?: string;
  to?: string;
  title?: string;
}

export function OwnershipPerformance({ lga, lgaId, from, to, title = "Remittance by Institution Ownership" }: OwnershipPerformanceProps) {
  const [items, setItems] = useState<OwnershipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const queryParams = new URLSearchParams();
        if (lga) queryParams.set("lga", lga);
        if (lgaId) queryParams.set("lgaId", String(lgaId));
        if (from) queryParams.set("from", from);
        if (to) queryParams.set("to", to);

        const url = `${API_BASE}/reports/performance-by-ownership?${queryParams.toString()}`;

        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load ownership performance data");
        }

        const data = await res.json();
        setItems(data.items || []);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [lga, from, to]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-white shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-white p-4 shadow-sm">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const totalRevenue = items.reduce((sum, item) => sum + item.totalAmount, 0);
  const chartLabels = items.map((item) => item.ownership);
  const chartValues = items.map((item) => item.totalAmount);

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">{title}</h2>
        <div className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
          Total: ₦{totalRevenue.toLocaleString("en-NG", { maximumFractionDigits: 0 })}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          {items.length > 0 ? (
            <RevenueBySourcePie labels={chartLabels} values={chartValues} />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-gray-500">
              No data available for the selected period.
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 font-medium uppercase tracking-wider">Ownership</th>
                <th className="px-3 py-2 font-medium uppercase tracking-wider text-center">Schools</th>
                <th className="px-3 py-2 font-medium uppercase tracking-wider text-right">Revenue (NGN)</th>
                <th className="px-3 py-2 font-medium uppercase tracking-wider text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, index) => {
                const percentage = totalRevenue > 0 ? (item.totalAmount / totalRevenue) * 100 : 0;
                return (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 font-medium text-gray-700">{item.ownership}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{item.schoolCount}</td>
                    <td className="px-3 py-3 text-right font-semibold text-gray-800">
                      ₦{item.totalAmount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-500">{percentage.toFixed(1)}%</td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-gray-400">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
