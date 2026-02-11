"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { DataTable } from "@/components/ui/DataTable";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface Payment {
  id: number;
  assessmentId: number;
  amountPaid: number;
  paymentDate?: string | null;
  method?: string | null;
  reference?: string | null;
  status?: string | null;
  assessment?: {
    entity?: { name: string };
    incomeSource?: { name?: string | null };
  };
  recorder?: { name?: string | null; email?: string | null };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const res = await fetch(`${API_BASE}/payments`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load payments");
        }
        const body: Payment[] = await res.json();
        setPayments(body);
      } catch (err: any) {
        setError(err.message || "Failed to load payments");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

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
      if (!res.ok) return;
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      // silent failure for now
    }
  }

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== "all" && (p.status || "") !== statusFilter) return false;
    if (methodFilter !== "all" && (p.method || "") !== methodFilter) return false;
    if (fromDate) {
      const d = p.paymentDate ? new Date(p.paymentDate) : null;
      if (!d || d < new Date(fromDate)) return false;
    }
    if (toDate) {
      const d = p.paymentDate ? new Date(p.paymentDate) : null;
      if (!d || d > new Date(toDate)) return false;
    }
    return true;
  });

  const uniqueStatuses = Array.from(
    new Set(payments.map((p) => (p.status || "").trim()).filter(Boolean)),
  ).sort();
  const uniqueMethods = Array.from(
    new Set(payments.map((p) => (p.method || "").trim()).filter(Boolean)),
  ).sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Payments</h1>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading payments...</p>}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="all">All</option>
                {uniqueStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Method:</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="all">All</option>
                {uniqueMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-600">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-600">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <DataTable
              data={filteredPayments}
              columns={[
                { header: "S/No", cell: (p, index) => <span className="text-xs">{p.id}</span> },
                {
                  header: "Date",
                  cell: (p) => <span className="text-xs">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-NG") : "-"}</span>
                },
                { header: "References (If Any)", cell: (p) => <span className="text-xs">{p.reference || "-"}</span> },
                {
                  header: "Recieved From",
                  cell: (p) => <span className="text-xs">{p.assessment?.entity?.name || p.recorder?.name || "-"}</span>
                },
                { header: "Method", cell: (p) => <span className="text-xs">{p.method || "-"}</span> },
                {
                  header: "Purpose",
                  cell: (p) => <span className="text-xs">{p.assessment?.incomeSource?.name || p.reference || "-"}</span>
                },
                {
                  header: <div className="text-right">Amount (NGN)</div>,
                  cell: (p) => (
                    <div className="text-right text-xs">
                      ₦{Number(p.amountPaid || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}
                    </div>
                  )
                },
                {
                  header: "Status",
                  cell: (p) => <span className="text-xs capitalize">{p.status || "-"}</span>
                },
                {
                  header: <div className="text-right">Action</div>,
                  cell: (p) => (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => handleViewInvoice(p.id)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View Invoice
                      </button>
                    </div>
                  )
                }
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
