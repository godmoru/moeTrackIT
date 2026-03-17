"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface Assessment {
  id: number;
  amountAssessed: string | number;
  status: string;
  assessmentPeriod: string | null;
  assessmentYear: number | null;
  assessmentTerm: number | null;
  dueDate: string | null;
  notes?: string | null;
  createdAt: string;
  entity?: {
    id: number;
    name: string;
  };
  incomeSource?: {
    id: number;
    name: string;
  };
  payments?: any[];
}

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useAuth();
  const id = params?.id as string | undefined;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

        const res = await fetch(`${API_BASE}/assessments/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load assessment");
        }

        const data: Assessment = await res.json();
        setAssessment(data);
      } catch (err: any) {
        setError(err.message || "Failed to load assessment");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 font-medium animate-pulse">Loading assessment details...</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-red-50 p-4 border border-red-100">
          <p className="text-sm text-red-600 font-medium">{error || "Assessment not found"}</p>
        </div>
        <Link
          href="/admin/assessments"
          className="inline-flex items-center gap-2 rounded-md bg-white border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-xl border border-gray-100 shadow-sm ring-1 ring-gray-900/5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              Assessment Details
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${
                assessment.status === "paid" || assessment.status === "confirmed"
                  ? "bg-green-50 text-green-700 ring-green-600/20"
                  : assessment.status === "pending"
                  ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20"
                  : "bg-gray-50 text-gray-700 ring-gray-600/20"
              }`}
            >
              {assessment.status}
            </span>
          </div>
          <p className="text-xs text-gray-500">ID: #{assessment.id} • Created on {new Date(assessment.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/assessments"
            className="flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to list
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Assessment Overview</h2>
            </div>
            <div className="p-6">
              {(() => {
                const rrr = assessment.payments?.find((p: any) => p.rrr)?.rrr;
                if (!rrr) return null;
                return (
                  <div className="mb-8 flex flex-col items-center justify-center p-6 bg-green-50 rounded-2xl border-2 border-dashed border-green-200 shadow-inner">
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] mb-1">Remita Retrieval Reference (RRR)</span>
                    <span className="text-4xl font-black text-green-700 tracking-tighter select-all cursor-copy" title="Click to copy RRR">
                      {rrr}
                    </span>
                  </div>
                );
              })()}
              <dl className="grid gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Institution</dt>
                  <dd className="mt-1 text-sm font-bold text-green-900">
                    {assessment.entity ? (
                      <Link href={`/admin/institutions/${assessment.entity.id}`} className="hover:underline">
                        {assessment.entity.name}
                      </Link>
                    ) : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Income Source</dt>
                  <dd className="mt-1 text-sm font-bold text-green-900">
                    {assessment.incomeSource ? (
                      <Link href={`/admin/income-sources/${assessment.incomeSource.id}`} className="hover:underline">
                        {assessment.incomeSource.name}
                      </Link>
                    ) : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Amount Assessed</dt>
                  <dd className="mt-1 text-xl font-black text-gray-900 tracking-tight">
                    ₦{Number(assessment.amountAssessed || 0).toLocaleString("en-NG")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Due Date</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">
                    {assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : "No due date"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Period</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">
                    {assessment.assessmentPeriod || "N/A"} 
                    {assessment.assessmentYear && ` (${assessment.assessmentYear})`}
                    {assessment.assessmentTerm && ` - Term ${assessment.assessmentTerm}`}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Descriptions / Notes</dt>
                  <dd className="mt-1 text-sm text-gray-700 leading-relaxed italic">
                    {assessment.notes || "No additional notes provided."}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Payments Table */}
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Payment History</h2>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {assessment.payments?.length || 0} Record(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
                <thead className="bg-gray-50/50 text-gray-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Date Paid</th>
                    <th className="px-6 py-3 font-semibold">RRR / Reference</th>
                    <th className="px-6 py-3 font-semibold text-center">Method</th>
                    <th className="px-6 py-3 font-semibold">Amount</th>
                    <th className="px-6 py-3 font-semibold text-center">Status</th>
                    <th className="px-6 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(!assessment.payments || assessment.payments.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">
                        No payments recorded for this assessment.
                      </td>
                    </tr>
                  ) : (
                    assessment.payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-mono text-[10px] text-gray-600 uppercase tracking-tighter">
                          {p.rrr || p.reference || "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 uppercase">
                            {p.method || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-green-700 whitespace-nowrap italic text-sm">
                          ₦{Number(p.amountPaid || 0).toLocaleString("en-NG")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ring-1 ring-inset ${
                            p.status === 'confirmed' ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-yellow-50 text-yellow-700 ring-yellow-600/20"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/payments/${p.id}`}
                            className="text-green-700 hover:text-green-800 font-bold"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Status / Summary Card */}
        <div className="space-y-6">
          <div className="rounded-xl bg-green-900 p-6 text-white shadow-lg shadow-green-900/20 ring-1 ring-green-900/5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-green-300/80">Payment Status</h3>
            <div className="mt-4 flex items-baseline gap-2">
              {assessment.status === 'paid' || assessment.status === 'confirmed' ? (
                 <>
                  <span className="text-3xl font-black italic tracking-tighter">SETTLED</span>
                  <div className="bg-green-400 p-1.5 rounded-full">
                    <svg className="w-5 h-5 text-green-900" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                 </>
              ) : (
                <span className="text-3xl font-black italic tracking-tighter uppercase">{assessment.status}</span>
              )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-green-800/50 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-green-300/80 font-medium">Total Amount</span>
                <span className="font-bold">₦{Number(assessment.amountAssessed).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-green-300/80 font-medium">Total Paid</span>
                <span className="font-bold">₦{assessment.payments?.reduce((sum, p) => sum + Number(p.amountPaid), 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-white font-bold tracking-tight">Remaining Balance</span>
                <span className="text-lg font-black italic">
                   ₦{(Number(assessment.amountAssessed) - (assessment.payments?.reduce((sum, p) => sum + Number(p.amountPaid), 0) || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            {assessment.status === 'pending' && (
              <Link 
                href={`/admin/pay?assessmentId=${assessment.id}`}
                className="mt-8 block w-full rounded-lg bg-green-400 py-3 text-center text-sm font-black text-green-950 uppercase tracking-wider hover:bg-white transition-all shadow-lg shadow-black/10"
              >
                Proceed to Payment
              </Link>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 border border-gray-100 shadow-sm ring-1 ring-gray-900/5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Quick Actions</h3>
            <div className="mt-4 flex flex-col gap-2">
              <button className="flex items-center gap-3 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all text-left group">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Assessment
              </button>
              <button className="flex items-center gap-3 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all text-left group">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Contact Institution
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
