"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { YearlyRevenueBar } from "@/components/Charts";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface IncomeSourceDetail {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  category: string;
  recurrence: string;
  defaultAmount: string | number;
  active: boolean;
}

interface AssessmentLite {
  id: number;
  entityId: number;
  incomeSourceId: number;
  assessmentPeriod?: string | null;
  status?: string | null;
  entity?: { name: string } | null;
}

interface PaymentLite {
  id: number;
  assessmentId: number;
  amountPaid: number;
  paymentDate?: string | null;
  method?: string | null;
  reference?: string | null;
  status?: string | null;
}

export default function IncomeSourceProfilePage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const incomeSourceIdNum = id ? Number(id) : NaN;

  const [source, setSource] = useState<IncomeSourceDetail | null>(null);
  const [assessments, setAssessments] = useState<AssessmentLite[]>([]);
  const [payments, setPayments] = useState<PaymentLite[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "assessments" | "revenue">(
    "overview",
  );
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(incomeSourceIdNum)) {
      setError("Invalid income source id");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

        const [sourcesRes, assessmentsRes, paymentsRes] = await Promise.all([
          fetch(`${API_BASE}/income-sources`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetch(`${API_BASE}/assessments`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetch(`${API_BASE}/payments`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
        ]);

        if (!sourcesRes.ok || !assessmentsRes.ok || !paymentsRes.ok) {
          const body = await sourcesRes.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load income source profile data");
        }

        const sourcesBody: IncomeSourceDetail[] = await sourcesRes.json();
        const target = sourcesBody.find((s) => s.id === incomeSourceIdNum) || null;
        const assessmentsBody: AssessmentLite[] = await assessmentsRes.json();
        const paymentsBody: PaymentLite[] = await paymentsRes.json();

        setSource(target);
        setAssessments(assessmentsBody);
        setPayments(paymentsBody);
      } catch (err: any) {
        setError(err.message || "Failed to load income source profile data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, incomeSourceIdNum]);

  if (!id || Number.isNaN(incomeSourceIdNum)) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">Invalid income source id.</p>
      </div>
    );
  }

  const sourceAssessments = assessments.filter(
    (a) => a.incomeSourceId === incomeSourceIdNum,
  );
  const assessmentIds = new Set(sourceAssessments.map((a) => a.id));
  const sourcePayments = payments.filter((p) => assessmentIds.has(p.assessmentId));

  const totalRevenue = sourcePayments.reduce(
    (sum, p) => sum + Number(p.amountPaid || 0),
    0,
  );

  const yearlyRevenueMap = new Map<string, number>();
  sourceAssessments.forEach((a) => {
    const year = (a.assessmentPeriod || "").toString() || "Unknown";
    const relatedPayments = sourcePayments.filter((p) => p.assessmentId === a.id);
    const sumForAssessment = relatedPayments.reduce(
      (s, p) => s + Number(p.amountPaid || 0),
      0,
    );
    const prev = yearlyRevenueMap.get(year) || 0;
    yearlyRevenueMap.set(year, prev + sumForAssessment);
  });

  const yearlyRows = Array.from(yearlyRevenueMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  const yearlyLabels = yearlyRows.map(([year]) => year);
  const yearlyValues = yearlyRows.map(([_, amt]) => Number(amt || 0));

  const availableYears = Array.from(
    new Set(
      sourceAssessments
        .map((a) => (a.assessmentPeriod || "").toString())
        .filter((y) => y && y.trim().length > 0),
    ),
  ).sort();

  const filteredAssessments = sourceAssessments.filter((a) => {
    const year = (a.assessmentPeriod || "").toString();
    if (yearFilter !== "all" && year !== yearFilter) return false;
    return true;
  });

  const recentPayments = [...sourcePayments]
    .sort((a, b) => {
      const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
      const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
      if (dateA !== dateB) return dateB - dateA;
      return b.id - a.id;
    })
    .slice(0, 5);

  async function handleViewInvoice(paymentId: number) {
    if (typeof window === "undefined") return;
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const res = await fetch(`${API_BASE}/payments/${paymentId}/invoice.pdf`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {source ? source.name : "Income Source"}
          </h1>
          {source?.code && (
            <p className="text-xs text-gray-500">Code: {source.code}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {source && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${
                source.active
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {source.active ? "active" : "inactive"}
            </span>
          )}
          <Link
            href="/admin/income-sources"
            className="rounded-md bg-gray-100 px-3 py-1 font-medium text-gray-700 hover:bg-gray-200"
          >
            Back to list
          </Link>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-gray-600">Loading income source profile...</p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && source && (
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-gray-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`border-b-2 px-3 py-2 font-medium ${
                activeTab === "overview"
                  ? "border-green-700 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("assessments")}
              className={`border-b-2 px-3 py-2 font-medium ${
                activeTab === "assessments"
                  ? "border-green-700 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Assessments
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("revenue")}
              className={`border-b-2 px-3 py-2 font-medium ${
                activeTab === "revenue"
                  ? "border-green-700 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Revenue
            </button>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-white p-4 shadow-sm md:col-span-2">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Overview
                  </h2>
                  <dl className="grid gap-3 text-xs md:grid-cols-2">
                    <div>
                      <dt className="font-medium text-gray-700">Name</dt>
                      <dd className="text-gray-900">{source.name}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700">Code</dt>
                      <dd className="text-gray-900">{source.code || "-"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700">Category</dt>
                      <dd className="capitalize text-gray-900">{source.category}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700">Recurrence</dt>
                      <dd className="capitalize text-gray-900">{source.recurrence}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700">Default Amount (NGN)</dt>
                      <dd className="text-gray-900">
                        ₦{Number(source.defaultAmount || 0).toLocaleString("en-NG")}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700">Status</dt>
                      <dd className="capitalize text-gray-900">
                        {source.active ? "active" : "inactive"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Description
                  </h2>
                  <p className="text-xs text-gray-900">
                    {source.description || "No description provided."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "assessments" && (
            <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-sm">
              <div className="space-y-3 p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Assessments
                </h2>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Year:</span>
                      <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      >
                        <option value="all">All</option>
                        {availableYears.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <table className="min-w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 font-medium">S/N</th>
                      <th className="px-3 py-2 font-medium">Year</th>
                      <th className="px-3 py-2 font-medium">Entity</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium text-right">Total Paid (NGN)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssessments.length === 0 && (
                      <tr>
                        <td className="px-3 py-2 text-xs text-gray-500" colSpan={5}>
                          No assessments recorded for this income source yet.
                        </td>
                      </tr>
                    )}
                    {filteredAssessments.map((a, index) => {
                      const relatedPayments = sourcePayments.filter(
                        (p) => p.assessmentId === a.id,
                      );
                      const sumForAssessment = relatedPayments.reduce(
                        (s, p) => s + Number(p.amountPaid || 0),
                        0,
                      );
                      const year = (a.assessmentPeriod || "").toString() || "-";
                      const status = a.status || "-";

                      return (
                        <tr key={a.id} className="border-t text-gray-800">
                          <td className="px-3 py-2 text-xs">{index + 1}</td>
                          <td className="px-3 py-2 text-xs">{year}</td>
                          <td className="px-3 py-2 text-xs">{a.entity?.name || "-"}</td>
                          <td className="px-3 py-2 text-xs capitalize">{status}</td>
                          <td className="px-3 py-2 text-right text-xs">
                            {sumForAssessment
                              ? `₦${sumForAssessment.toLocaleString("en-NG", {
                                  maximumFractionDigits: 2,
                                })}`
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "revenue" && (
            <div className="space-y-4">
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Total Revenue (NGN)
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-green-700">
                    ₦{totalRevenue.toLocaleString("en-NG", { maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Total Assessments
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">
                    {sourceAssessments.length}
                  </div>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Total Payments
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">
                    {sourcePayments.length}
                  </div>
                </div>
              </div>

              {yearlyLabels.length > 0 && (
                <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
                  <YearlyRevenueBar labels={yearlyLabels} values={yearlyValues} />
                </div>
              )}

              <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-sm">
                <div className="p-4">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Recent Payments
                  </h2>
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">S/N</th>
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Entity</th>
                        <th className="px-3 py-2 font-medium">Method</th>
                        <th className="px-3 py-2 font-medium text-right">Amount (NGN)</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments.length === 0 && (
                        <tr>
                          <td className="px-3 py-2 text-xs text-gray-500" colSpan={7}>
                            No payments recorded for this income source yet.
                          </td>
                        </tr>
                      )}
                      {recentPayments.map((p, index) => {
                        const dateLabel = p.paymentDate
                          ? new Date(p.paymentDate).toLocaleDateString("en-NG")
                          : "-";
                        const status = p.status || "-";

                        const relatedAssessment = sourceAssessments.find(
                          (a) => a.id === p.assessmentId,
                        );

                        return (
                          <tr key={p.id} className="border-t text-gray-800">
                            <td className="px-3 py-2 text-xs">{index + 1}</td>
                            <td className="px-3 py-2 text-xs">{dateLabel}</td>
                            <td className="px-3 py-2 text-xs">
                              {relatedAssessment?.entity?.name || "-"}
                            </td>
                            <td className="px-3 py-2 text-xs">{p.method || "-"}</td>
                            <td className="px-3 py-2 text-right text-xs">
                              ₦{Number(p.amountPaid || 0).toLocaleString("en-NG", {
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-3 py-2 text-xs capitalize">{status}</td>
                            <td className="px-3 py-2 text-right text-xs">
                              <button
                                type="button"
                                onClick={() => handleViewInvoice(p.id)}
                                className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                              >
                                View Invoice
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
