"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProgressRing, DonutChart } from "@/components/Charts";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface Payment {
  id: number;
  amountPaid: number;
  paymentDate: string;
  method?: string;
  reference?: string;
  assessment?: {
    entity?: { name: string };
    incomeSource?: { name: string };
  };
  recorder?: { name: string };
}

interface Assessment {
  id: number;
  status: string;
  amountAssessed: number;
  entity?: { name: string };
  incomeSource?: { name: string };
}

export function CashierDashboard() {
  const [todayPayments, setTodayPayments] = useState<Payment[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [pendingAssessments, setPendingAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

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

        // Load all payments
        const paymentsRes = await fetch(`${API_BASE}/payments`, { headers });
        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          const payments = Array.isArray(data) ? data : [];
          
          // Filter today's payments
          const todayList = payments.filter((p: Payment) => 
            p.paymentDate?.startsWith(today)
          );
          setTodayPayments(todayList);

          // Recent payments (last 10)
          const sorted = [...payments].sort(
            (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
          );
          setRecentPayments(sorted.slice(0, 10));
        }

        // Load pending assessments
        const assessmentsRes = await fetch(`${API_BASE}/assessments`, { headers });
        if (assessmentsRes.ok) {
          const data = await assessmentsRes.json();
          const assessments = Array.isArray(data) ? data : [];
          const pending = assessments.filter(
            (a: Assessment) => a.status === "pending" || a.status === "part_paid"
          );
          setPendingAssessments(pending.slice(0, 10));
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [today]);

  // Calculate today's stats
  const todayTotal = todayPayments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);
  const todayCount = todayPayments.length;
  const pendingTotal = pendingAssessments.reduce((sum, a) => sum + Number(a.amountAssessed || 0), 0);

  // Calculate payment methods breakdown
  const methodCounts = recentPayments.reduce((acc, p) => {
    const method = p.method || "Cash";
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const methodData = Object.entries(methodCounts).map(([status, count]) => ({ status, count }));

  // Calculate daily target progress (example: 500k daily target)
  const dailyTarget = 500000;
  const targetProgress = Math.min((todayTotal / dailyTarget) * 100, 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Cashier Dashboard</h1>
          <p className="text-sm text-gray-600">
            Daily revenue collection and payment processing.
          </p>
        </div>
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
          Cashier / Account Officer
        </span>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Link 
          href="/admin/payments?action=new" 
          className="rounded-lg bg-green-600 p-3 hover:bg-green-700 transition-colors text-white"
        >
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <div>
              <div className="text-sm font-medium">Record Payment</div>
              <div className="text-[11px] text-green-100">New collection</div>
            </div>
          </div>
        </Link>
        <Link href="/admin/payments" className="rounded-lg bg-blue-50 p-3 hover:bg-blue-100 transition-colors">
          <div className="text-xs font-medium text-blue-800">All Payments</div>
          <div className="text-[11px] text-blue-600">View history</div>
        </Link>
        <Link href="/admin/assessments" className="rounded-lg bg-orange-50 p-3 hover:bg-orange-100 transition-colors">
          <div className="text-xs font-medium text-orange-800">Pending Bills</div>
          <div className="text-[11px] text-orange-600">Awaiting payment</div>
        </Link>
        <Link href="/admin/reports" className="rounded-lg bg-purple-50 p-3 hover:bg-purple-100 transition-colors">
          <div className="text-xs font-medium text-purple-800">Daily Report</div>
          <div className="text-[11px] text-purple-600">Generate summary</div>
        </Link>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading data...</p>}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          {/* Today's Summary with Progress */}
          <div className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-5 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-green-100">
                  Today&apos;s Collection — {new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
                <div className="mt-3 grid gap-6 sm:grid-cols-3">
                  <div>
                    <div className="text-3xl font-bold">
                      ₦{todayTotal.toLocaleString("en-NG")}
                    </div>
                    <div className="text-sm text-green-100">Total Collected</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{todayCount}</div>
                    <div className="text-sm text-green-100">Transactions</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">
                      ₦{todayCount > 0 ? Math.round(todayTotal / todayCount).toLocaleString("en-NG") : 0}
                    </div>
                    <div className="text-sm text-green-100">Avg. Transaction</div>
                  </div>
                </div>
              </div>
              {/* Daily Target Ring */}
              <div className="hidden sm:block">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - targetProgress / 100)}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold">{targetProgress.toFixed(0)}%</span>
                    <span className="text-[8px] text-green-100">of target</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-green-100 mb-1">
                <span>Daily Target Progress</span>
                <span>₦{dailyTarget.toLocaleString()} target</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${targetProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Visual Stats Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-4 shadow-sm flex items-center gap-4">
              <ProgressRing value={todayCount} max={Math.max(todayCount, 20)} label="" color="blue" size="sm" />
              <div>
                <div className="text-2xl font-bold text-gray-800">{todayCount}</div>
                <div className="text-xs text-gray-500">Today&apos;s Transactions</div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm flex items-center gap-4">
              <ProgressRing value={pendingAssessments.length} max={Math.max(pendingAssessments.length + 5, 10)} label="" color="orange" size="sm" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{pendingAssessments.length}</div>
                <div className="text-xs text-gray-500">Pending Bills</div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm flex items-center gap-4">
              <ProgressRing value={recentPayments.length} max={Math.max(recentPayments.length, 50)} label="" color="green" size="sm" />
              <div>
                <div className="text-2xl font-bold text-green-600">{recentPayments.length}</div>
                <div className="text-xs text-gray-500">Recent Payments</div>
              </div>
            </div>
          </div>

          {/* Payment Methods Donut */}
          {methodData.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <DonutChart
                  data={methodData}
                  title="Payment Methods"
                  centerLabel="Methods"
                  centerValue={methodData.length}
                />
              </div>
              <div className="md:col-span-2 rounded-xl bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-gray-700 mb-3">Outstanding Summary</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-orange-50 p-4">
                    <div className="text-xs text-orange-600 uppercase font-medium">Pending Amount</div>
                    <div className="text-2xl font-bold text-orange-700 mt-1">
                      ₦{pendingTotal.toLocaleString("en-NG")}
                    </div>
                    <div className="text-xs text-orange-500 mt-1">{pendingAssessments.length} assessments</div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4">
                    <div className="text-xs text-green-600 uppercase font-medium">Collected Today</div>
                    <div className="text-2xl font-bold text-green-700 mt-1">
                      ₦{todayTotal.toLocaleString("en-NG")}
                    </div>
                    <div className="text-xs text-green-500 mt-1">{todayCount} transactions</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Today's Payments */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Today&apos;s Payments ({todayCount})
                </div>
                <Link href="/admin/payments" className="text-xs text-green-700 hover:underline">
                  View all
                </Link>
              </div>
              {todayPayments.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {todayPayments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2 text-xs"
                    >
                      <div>
                        <div className="font-medium text-gray-800">
                          {p.assessment?.entity?.name || "Unknown"}
                        </div>
                        <div className="text-gray-500">
                          {p.assessment?.incomeSource?.name || "-"} • {p.method || "Cash"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-700">
                          ₦{Number(p.amountPaid).toLocaleString("en-NG")}
                        </div>
                        <div className="text-gray-400">
                          {new Date(p.paymentDate).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="mt-2 text-sm">No payments recorded today</p>
                  <Link
                    href="/admin/payments?action=new"
                    className="mt-3 inline-block rounded-md bg-green-700 px-4 py-2 text-xs font-medium text-white hover:bg-green-800"
                  >
                    Record First Payment
                  </Link>
                </div>
              )}
            </div>

            {/* Pending Assessments */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Pending Payments ({pendingAssessments.length})
                </div>
                <div className="text-xs text-orange-600 font-medium">
                  ₦{pendingTotal.toLocaleString("en-NG")} outstanding
                </div>
              </div>
              {pendingAssessments.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pendingAssessments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-md bg-orange-50 px-3 py-2 text-xs"
                    >
                      <div>
                        <div className="font-medium text-gray-800">
                          {a.entity?.name || "Unknown"}
                        </div>
                        <div className="text-gray-500">
                          {a.incomeSource?.name || "-"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-orange-700">
                          ₦{Number(a.amountAssessed).toLocaleString("en-NG")}
                        </div>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          a.status === "part_paid" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-orange-100 text-orange-800"
                        }`}>
                          {a.status === "part_paid" ? "Partial" : "Pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-sm text-gray-500">
                  No pending assessments
                </p>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-medium text-gray-500 uppercase">
                Recent Payments
              </div>
              <Link href="/admin/payments" className="text-xs text-green-700 hover:underline">
                View all
              </Link>
            </div>
            {recentPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Institution</th>
                      <th className="pb-2 font-medium">Income Source</th>
                      <th className="pb-2 font-medium">Method</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="py-2 text-gray-600">
                          {new Date(p.paymentDate).toLocaleDateString("en-NG")}
                        </td>
                        <td className="py-2 font-medium text-gray-800">
                          {p.assessment?.entity?.name || "-"}
                        </td>
                        <td className="py-2 text-gray-600">
                          {p.assessment?.incomeSource?.name || "-"}
                        </td>
                        <td className="py-2 text-gray-600 capitalize">
                          {p.method || "Cash"}
                        </td>
                        <td className="py-2 text-right font-semibold text-green-700">
                          ₦{Number(p.amountPaid).toLocaleString("en-NG")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-4 text-sm text-gray-500">No recent payments</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
