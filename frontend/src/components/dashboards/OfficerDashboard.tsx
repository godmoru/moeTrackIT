"use client";

import { useEffect, useState } from "react";
import { StatusBarChart } from "@/components/Charts";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface StatusCount {
  status: string;
  count: string | number;
}

interface SummaryResponse {
  totalCollected: number;
  statusCounts: StatusCount[];
}

interface LgaRemittanceItem {
  lga: string;
  totalAmount: number;
}

export function OfficerDashboard() {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [lgaData, setLgaData] = useState<LgaRemittanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const defaultTo = today.toISOString().slice(0, 10);

  const [from, setFrom] = useState<string>(defaultFrom);
  const [to, setTo] = useState<string>(defaultTo);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const query = new URLSearchParams();
        if (from) query.set("from", from);
        if (to) query.set("to", to);

        const res = await fetch(`${API_BASE}/reports/summary?${query.toString()}`, {
          headers,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load summary");
        }
        const body = await res.json();
        setData(body);

        // Load LGA remittance summary
        const lgaRes = await fetch(
          `${API_BASE}/reports/remittance-by-lga?${query.toString()}`,
          { headers }
        );
        if (lgaRes.ok) {
          const lgaBody = await lgaRes.json();
          if (Array.isArray(lgaBody?.items)) {
            setLgaData(
              lgaBody.items.map((item: any) => ({
                lga: String(item.lga || "Unspecified"),
                totalAmount: Number(item.totalAmount || 0),
              }))
            );
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load summary");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [from, to]);

  const totalCollected = data?.totalCollected ?? 0;
  const sortedLga = [...lgaData].sort((a, b) => b.totalAmount - a.totalAmount);
  const topLgas = sortedLga.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Officer Dashboard</h1>
          <p className="text-sm text-gray-600">
            State-wide revenue collection and assessment overview.
          </p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
          Officer
        </span>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-5">
        <Link href="/admin/institutions" className="rounded-lg bg-blue-50 p-3 hover:bg-blue-100 transition-colors">
          <div className="text-xs font-medium text-blue-800">Institutions</div>
          <div className="text-[11px] text-blue-600">View all schools</div>
        </Link>
        <Link href="/admin/assessments" className="rounded-lg bg-green-50 p-3 hover:bg-green-100 transition-colors">
          <div className="text-xs font-medium text-green-800">Assessments</div>
          <div className="text-[11px] text-green-600">Manage assessments</div>
        </Link>
        <Link href="/admin/payments" className="rounded-lg bg-yellow-50 p-3 hover:bg-yellow-100 transition-colors">
          <div className="text-xs font-medium text-yellow-800">Payments</div>
          <div className="text-[11px] text-yellow-600">Record payments</div>
        </Link>
        <Link href="/admin/expenditures" className="rounded-lg bg-red-50 p-3 hover:bg-red-100 transition-colors">
          <div className="text-xs font-medium text-red-800">Expenditures</div>
          <div className="text-[11px] text-red-600">Manage expenditures</div>
        </Link>
        <Link href="/admin/reports" className="rounded-lg bg-orange-50 p-3 hover:bg-orange-100 transition-colors">
          <div className="text-xs font-medium text-orange-800">Reports</div>
          <div className="text-[11px] text-orange-600">Generate reports</div>
        </Link>
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <div>
          <label className="block text-xs font-medium text-gray-600">From</label>
          <input
            type="date"
            className="mt-1 rounded border border-gray-300 px-2 py-1 text-xs"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">To</label>
          <input
            type="date"
            className="mt-1 rounded border border-gray-300 px-2 py-1 text-xs"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading summary...</p>}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      
      {!loading && !error && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Collected (NGN)
              </div>
              <div className="mt-2 text-2xl font-semibold text-green-700">
                ₦{totalCollected.toLocaleString("en-NG", { maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm md:col-span-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Assessments by Status
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {data?.statusCounts?.length ? (
                  data.statusCounts.map((item) => (
                    <div
                      key={item.status}
                      className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-800"
                    >
                      <span className="font-medium capitalize">{item.status}</span>
                      <span className="text-gray-700">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No assessments recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {topLgas.length ? (
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Top 5 LGAs by Remittance
              </div>
              <StatusBarChart
                title=""
                data={topLgas.map((item) => ({
                  status: item.lga,
                  count: item.totalAmount,
                }))}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
