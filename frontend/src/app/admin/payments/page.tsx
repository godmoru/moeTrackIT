"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  gatewayResponse?: string | null;
  rrr?: string | null;
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
        const body = await res.json();
        setPayments(body.items || body);
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

  async function handleVerifyRemita(payment: Payment) {
    try {
      const token = localStorage.getItem("authToken");
      const identifier = payment.rrr || payment.reference || String(payment.id);

      const res = await fetch(`${API_BASE}/payments/remita/verify/${identifier}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Verification failed");

      if (data.status === "success") {
        const Swal = (await import("sweetalert2")).default;
        await Swal.fire({
          icon: "success",
          title: "Payment Verified",
          text: "The payment has been successfully confirmed.",
        });
        // Refresh list
        window.location.reload();
      } else {
        const Swal = (await import("sweetalert2")).default;
        await Swal.fire({
          icon: "warning",
          title: "Verification Incomplete",
          text: data.message || "The payment status is still pending or was not successful.",
        });
      }
    } catch (err: any) {
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        icon: "error",
        title: "Verification Error",
        text: err.message || "Failed to verify payment",
      });
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
                {
                  header: "References (If Any)",
                  cell: (p) => (
                    <div className="text-xs">
                      {p.rrr && <div className="font-bold text-orange-700">RRR: {p.rrr}</div>}
                      {p.reference && <div className={p.rrr ? "text-[10px] text-gray-400 mt-0.5" : "text-gray-600"}>{p.rrr ? `Ref: ${p.reference}` : p.reference}</div>}
                      {!p.rrr && !p.reference && "-"}
                    </div>
                  )
                },
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
                    <div className="flex justify-end gap-2">
                      {p.status !== "confirmed" && p.status !== "paid" && p.method === "remita" && (
                        <button
                          type="button"
                          onClick={() => handleVerifyRemita(p)}
                          className="rounded-md bg-orange-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-orange-700"
                        >
                          Verify
                        </button>
                      )}
                      <Link
                        href={`/admin/payments/${p.id}`}
                        className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleViewInvoice(p.id)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Invoice
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
