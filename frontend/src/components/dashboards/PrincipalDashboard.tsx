"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface Entity {
  id: number;
  name: string;
  code?: string;
  lga?: string;
  status: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}

interface Assessment {
  id: number;
  status: string;
  amountAssessed: number;
  assessmentPeriod?: string;
  dueDate?: string;
  incomeSource?: { name: string };
  payments?: Payment[];
}

interface Payment {
  id: number;
  amountPaid: number;
  paymentDate: string;
  method?: string;
  reference?: string;
}

export function PrincipalDashboard() {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
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

        // Load entity (principal's school - scoped by backend)
        const entitiesRes = await fetch(`${API_BASE}/institutions`, { headers });
        if (entitiesRes.ok) {
          const data = await entitiesRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setEntity(data[0]); // Principal should only see their own school
          }
        }

        // Load assessments (scoped to principal's entity)
        const assessmentsRes = await fetch(`${API_BASE}/assessments`, { headers });
        if (assessmentsRes.ok) {
          const data = await assessmentsRes.json();
          setAssessments(Array.isArray(data) ? data : []);
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
  const totalAssessments = assessments.length;
  const pendingAssessments = assessments.filter((a) => a.status === "pending");
  const paidAssessments = assessments.filter((a) => a.status === "paid");
  const partPaidAssessments = assessments.filter((a) => a.status === "part_paid");

  const totalAssessed = assessments.reduce((sum, a) => sum + Number(a.amountAssessed || 0), 0);
  const totalPaid = assessments.reduce((sum, a) => {
    const payments = a.payments || [];
    return sum + payments.reduce((pSum, p) => pSum + Number(p.amountPaid || 0), 0);
  }, 0);
  const outstanding = totalAssessed - totalPaid;

  // Upcoming due dates
  const upcomingDue = assessments
    .filter((a) => a.status !== "paid" && a.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Principal Dashboard</h1>
          <p className="text-sm text-gray-600">
            View your school&apos;s assessments and payment status.
          </p>
        </div>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">
          Principal
        </span>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading data...</p>}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          {/* School info card */}
          {entity && (
            <div className="rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 text-white shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{entity.name}</h2>
                  {entity.code && (
                    <p className="text-sm text-indigo-200">Code: {entity.code}</p>
                  )}
                  {entity.lga && (
                    <p className="text-sm text-indigo-200">{entity.lga} LGA</p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    entity.status === "active"
                      ? "bg-green-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {entity.status}
                </span>
              </div>
              {(entity.contactPerson || entity.contactPhone) && (
                <div className="mt-3 border-t border-indigo-500 pt-3 text-sm text-indigo-100">
                  {entity.contactPerson && <p>Contact: {entity.contactPerson}</p>}
                  {entity.contactPhone && <p>Phone: {entity.contactPhone}</p>}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          {/* <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/admin/assessments" className="rounded-lg bg-green-50 p-3 hover:bg-green-100 transition-colors">
              <div className="text-xs font-medium text-green-800">My Assessments</div>
              <div className="text-[11px] text-green-600">View all assessments</div>
            </Link>
            <Link href="/admin/payments" className="rounded-lg bg-yellow-50 p-3 hover:bg-yellow-100 transition-colors">
              <div className="text-xs font-medium text-yellow-800">Payment History</div>
              <div className="text-[11px] text-yellow-600">View payments made</div>
            </Link>
            <Link href="/admin/reports" className="rounded-lg bg-orange-50 p-3 hover:bg-orange-100 transition-colors">
              <div className="text-xs font-medium text-orange-800">Reports</div>
              <div className="text-[11px] text-orange-600">Download statements</div>
            </Link>
          </div> */}

          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">Total Assessed</div>
              <div className="mt-2 text-xl font-semibold text-gray-700">
                ₦{totalAssessed.toLocaleString("en-NG")}
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">Total Paid</div>
              <div className="mt-2 text-xl font-semibold text-green-700">
                ₦{totalPaid.toLocaleString("en-NG")}
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">Outstanding</div>
              <div className={`mt-2 text-xl font-semibold ${outstanding > 0 ? "text-red-600" : "text-gray-700"}`}>
                ₦{outstanding.toLocaleString("en-NG")}
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">Assessments</div>
              <div className="mt-2 text-xl font-semibold text-blue-700">{totalAssessments}</div>
              <div className="text-xs text-gray-500">
                {paidAssessments.length} paid, {pendingAssessments.length} pending
              </div>
            </div>
          </div>

          {/* Assessment status breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Pending assessments */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase mb-3">
                Pending Assessments ({pendingAssessments.length})
              </div>
              {pendingAssessments.length > 0 ? (
                <div className="space-y-2">
                  {pendingAssessments.slice(0, 5).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-md bg-yellow-50 px-3 py-2 text-xs"
                    >
                      <div>
                        <div className="font-medium text-gray-800">
                          {a.incomeSource?.name || "Assessment"}
                        </div>
                        <div className="text-gray-500">{a.assessmentPeriod || "-"}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-yellow-700">
                          ₦{Number(a.amountAssessed).toLocaleString("en-NG")}
                        </div>
                        {a.dueDate && (
                          <div className="text-gray-500">
                            Due: {new Date(a.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No pending assessments.</p>
              )}
            </div>

            {/* Upcoming due dates */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase mb-3">
                Upcoming Due Dates
              </div>
              {upcomingDue.length > 0 ? (
                <div className="space-y-2">
                  {upcomingDue.map((a) => {
                    const dueDate = new Date(a.dueDate!);
                    const isOverdue = dueDate < new Date();
                    return (
                      <div
                        key={a.id}
                        className={`flex items-center justify-between rounded-md px-3 py-2 text-xs ${
                          isOverdue ? "bg-red-50" : "bg-gray-50"
                        }`}
                      >
                        <div>
                          <div className="font-medium text-gray-800">
                            {a.incomeSource?.name || "Assessment"}
                          </div>
                          <div className={isOverdue ? "text-red-600 font-medium" : "text-gray-500"}>
                            {isOverdue ? "OVERDUE" : dueDate.toLocaleDateString()}
                          </div>
                        </div>
                        <div className="font-semibold text-gray-700">
                          ₦{Number(a.amountAssessed).toLocaleString("en-NG")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No upcoming due dates.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
