"use client";

import { useEffect, useState } from "react";
import { 
  DonutChart, 
  ComparisonBarChart, 
  StatCardWithTrend,
  ProgressRing,
} from "@/components/Charts";
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

export function SuperAdminDashboard() {
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
  const lgaCount = lgaData.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-sm text-gray-600">
            State-wide overview of collections and assessments across all LGAs.
          </p>
        </div>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
          Super Admin
        </span>
      </div>

      {/* Quick Actions */}
      {/* <div className="grid gap-3 sm:grid-cols-4">
        <Link href="/admin/control-panel" className="rounded-lg bg-purple-50 p-3 hover:bg-purple-100 transition-colors">
          <div className="text-xs font-medium text-purple-800">Control Panel</div>
          <div className="text-[11px] text-purple-600">Users, Roles & Settings</div>
        </Link>
        <Link href="/admin/institutions" className="rounded-lg bg-blue-50 p-3 hover:bg-blue-100 transition-colors">
          <div className="text-xs font-medium text-blue-800">Institutions</div>
          <div className="text-[11px] text-blue-600">Manage all schools</div>
        </Link>
        <Link href="/admin/assessments" className="rounded-lg bg-green-50 p-3 hover:bg-green-100 transition-colors">
          <div className="text-xs font-medium text-green-800">Assessments</div>
          <div className="text-[11px] text-green-600">View & create assessments</div>
        </Link>
        <Link href="/admin/reports" className="rounded-lg bg-orange-50 p-3 hover:bg-orange-100 transition-colors">
          <div className="text-xs font-medium text-orange-800">Reports</div>
          <div className="text-[11px] text-orange-600">Generate reports</div>
        </Link>
      </div> */}

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
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && (
        <div className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCardWithTrend
              title="Total Collected"
              value={`₦${(totalCollected / 1000000).toFixed(1)}M`}
              trend={12.5}
              trendData={[40, 45, 42, 55, 60, 65, 70]}
              color="green"
            />
            <StatCardWithTrend
              title="Total Assessments"
              value={data?.statusCounts?.reduce((sum, s) => sum + Number(s.count), 0) || 0}
              trend={8.2}
              trendData={[20, 25, 22, 28, 30, 32, 35]}
              color="blue"
            />
            <StatCardWithTrend
              title="Active LGAs"
              value={lgaCount}
              trend={5.0}
              color="purple"
            />
            <StatCardWithTrend
              title="Collection Rate"
              value="78%"
              trend={-2.3}
              color="green"
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Assessment Status Donut */}
            {data?.statusCounts?.length ? (
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <DonutChart
                  data={data.statusCounts}
                  title="Assessments by Status"
                  centerLabel="Total"
                />
              </div>
            ) : null}

            {/* LGA Performance */}
            {topLgas.length ? (
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <ComparisonBarChart
                  title="Top 5 LGAs by Remittance"
                  data={topLgas.map((item) => ({
                    label: item.lga,
                    value: item.totalAmount,
                  }))}
                  valuePrefix="₦"
                />
              </div>
            ) : null}
          </div>

          {/* Progress Indicators */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-700 mb-4">Collection Targets</div>
            <div className="flex flex-wrap justify-around gap-4">
              <ProgressRing
                value={totalCollected}
                max={totalCollected * 1.3}
                label="Annual Target"
                color="green"
                size="lg"
              />
              <ProgressRing
                value={data?.statusCounts?.find(s => s.status === "paid")?.count as number || 0}
                max={data?.statusCounts?.reduce((sum, s) => sum + Number(s.count), 0) || 1}
                label="Paid Assessments"
                color="blue"
                size="lg"
              />
              <ProgressRing
                value={lgaCount}
                max={23}
                label="LGA Coverage"
                color="purple"
                size="lg"
              />
              <ProgressRing
                value={78}
                max={100}
                label="Efficiency"
                color="orange"
                size="lg"
              />
            </div>
          </div>

          {/* LGA Summary Cards */}
          {topLgas.length > 0 && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-gray-700">LGA Performance Summary</div>
                <Link href="/admin/lgas" className="text-xs text-green-600 hover:underline">
                  View all LGAs →
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {topLgas.map((lga, i) => {
                  const colors = ["bg-purple-500", "bg-cyan-500", "bg-amber-500", "bg-red-500", "bg-green-500"];
                  return (
                    <div key={lga.lga} className="relative overflow-hidden rounded-lg bg-gray-50 p-4">
                      <div className={`absolute top-0 left-0 w-1 h-full ${colors[i]}`} />
                      <div className="text-xs text-gray-500 truncate">{lga.lga}</div>
                      <div className="text-lg font-bold text-gray-800 mt-1">
                        ₦{(lga.totalAmount / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        #{i + 1} in state
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
