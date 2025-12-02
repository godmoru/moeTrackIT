"use client";

import { useEffect, useState } from "react";
import { StatusBarChart } from "@/components/Charts";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface StatusCount {
  status: string;
  count: string | number;
}

interface SummaryResponse {
  totalCollected: number;
  statusCounts: StatusCount[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const res = await fetch(`${API_BASE}/reports/summary`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load summary");
        }
        const body = await res.json();
        setData(body);
      } catch (err: any) {
        setError(err.message || "Failed to load summary");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalCollected = data?.totalCollected ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
      <p className="text-sm text-gray-600">
        Overview of collections and assessment statuses across Benue State.
      </p>
      {loading && <p className="text-sm text-gray-600">Loading summary...</p>}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
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
                  <p className="text-xs text-gray-500">
                    No assessments have been recorded yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {data?.statusCounts?.length ? (
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <StatusBarChart title="Assessments by Status (Chart)" data={data.statusCounts} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
