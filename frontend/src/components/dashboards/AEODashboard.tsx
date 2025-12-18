"use client";

import { useEffect, useState } from "react";
import { StatusBarChart } from "@/components/Charts";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface Entity {
  id: number;
  name: string;
  status: string;
  lga?: string;
}

interface Assessment {
  id: number;
  status: string;
  amountAssessed: number;
  entity?: { name: string };
  incomeSource?: { name: string };
}

interface Payment {
  id: number;
  amountPaid: number;
  paymentDate: string;
  assessment?: { entity?: { name: string } };
}

export function AEODashboard() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Load institutions in assigned LGA(s)
        const entitiesRes = await fetch(`${API_BASE}/institutions`, { headers });
        if (entitiesRes.ok) {
          const data = await entitiesRes.json();
          setEntities(Array.isArray(data) ? data : []);
        }

        // Load assessments (scoped to assigned LGA)
        const assessmentsRes = await fetch(`${API_BASE}/assessments`, { headers });
        if (assessmentsRes.ok) {
          const data = await assessmentsRes.json();
          setAssessments(Array.isArray(data) ? data : []);
        }

        // Load payments (scoped to assigned LGA)
        const paymentsRes = await fetch(`${API_BASE}/payments`, { headers });
        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          setPayments(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Calculate stats
  const totalEntities = entities.length;
  const activeEntities = entities.filter((e) => e.status === "active").length;
  const totalAssessments = assessments.length;
  const pendingAssessments = assessments.filter((a) => a.status === "pending").length;
  const paidAssessments = assessments.filter((a) => a.status === "paid").length;
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);
  const totalAssessed = assessments.reduce((sum, a) => sum + Number(a.amountAssessed || 0), 0);

  // Status counts for chart
  const statusCounts = assessments.reduce((acc, a) => {
    const status = a.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  // Recent payments
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Area Education Officer Dashboard</h1>
          <p className="text-sm text-gray-600">
            Overview of schools and collections in your assigned LGA(s).
          </p>
        </div>
        <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800">
          Area Education Officer
        </span>
      </div>

      {/* Quick Actions */}
      {/* <div className="grid gap-3 sm:grid-cols-4">
        <Link href="/admin/institutions" className="rounded-lg bg-blue-50 p-3 hover:bg-blue-100 transition-colors">
          <div className="text-xs font-medium text-blue-800">Schools</div>
          <div className="text-[11px] text-blue-600">View LGA schools</div>
        </Link>
        <Link href="/admin/assessments" className="rounded-lg bg-green-50 p-3 hover:bg-green-100 transition-colors">
          <div className="text-xs font-medium text-green-800">Assessments</div>
          <div className="text-[11px] text-green-600">View assessments</div>
        </Link>
        <Link href="/admin/payments" className="rounded-lg bg-yellow-50 p-3 hover:bg-yellow-100 transition-colors">
          <div className="text-xs font-medium text-yellow-800">Payments</div>
          <div className="text-[11px] text-yellow-600">Record payments</div>
        </Link>
        <Link href="/admin/reports" className="rounded-lg bg-orange-50 p-3 hover:bg-orange-100 transition-colors">
          <div className="text-xs font-medium text-orange-800">Reports</div>
          <div className="text-[11px] text-orange-600">LGA reports</div>
        </Link>
      </div> */}

      {loading && <p className="text-sm text-gray-600">Loading data...</p>}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">Schools</div>
              <div className="mt-2 text-2xl font-semibold text-blue-700">{totalEntities}</div>
              <div className="text-xs text-gray-500">{activeEntities} active</div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">Assessments</div>
              <div className="mt-2 text-2xl font-semibold text-green-700">{totalAssessments}</div>
              <div className="text-xs text-gray-500">{pendingAssessments} pending</div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">Total Assessed</div>
              <div className="mt-2 text-xl font-semibold text-gray-700">
                ₦{totalAssessed.toLocaleString("en-NG")}
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">Total Collected</div>
              <div className="mt-2 text-xl font-semibold text-green-700">
                ₦{totalCollected.toLocaleString("en-NG")}
              </div>
            </div>
          </div>

          {/* Assessment status chart */}
          {statusData.length > 0 && (
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase mb-3">
                Assessments by Status
              </div>
              <StatusBarChart title="" data={statusData} />
            </div>
          )}

          {/* Recent payments */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="text-xs font-medium text-gray-500 uppercase mb-3">
              Recent Payments
            </div>
            {recentPayments.length > 0 ? (
              <div className="space-y-2">
                {recentPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-xs"
                  >
                    <div>
                      <div className="font-medium text-gray-800">
                        {p.assessment?.entity?.name || "Unknown School"}
                      </div>
                      <div className="text-gray-500">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="font-semibold text-green-700">
                      ₦{Number(p.amountPaid).toLocaleString("en-NG")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No recent payments.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
