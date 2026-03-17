"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  CreditCard,
  User,
  Building2,
  Calendar,
  Hash,
  FileText,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import Swal from "sweetalert2";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface Payment {
  id: number;
  assessmentId: number;
  amountPaid: number;
  paymentDate: string | null;
  method: string | null;
  reference: string | null;
  status: string | null;
  rrr: string | null;
  payerName: string | null;
  payerEmail: string | null;
  gatewayResponse: string | null;
  recordedBy: number | null;
  assessment?: {
    id: number;
    amountAssessed: number;
    assessmentPeriod: string | null;
    status: string | null;
    entity?: {
      id: number;
      name: string;
      code: string | null;
      lga: string | null;
    };
    incomeSource?: {
      name: string | null;
    };
  };
  recorder?: {
    name: string | null;
    email: string | null;
  };
}

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function loadPayment() {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE}/payments/${resolvedParams.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch payment details");
      }

      const data = await res.json();
      setPayment(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayment();
  }, [resolvedParams.id]);

  async function handleDownloadInvoice() {
    if (!payment) return;
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE}/payments/${payment.id}/invoice.pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to generate invoice");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${payment.reference || payment.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: err.message
      });
    }
  }

  async function handleVerifyPayment() {
    if (!payment) return;
    try {
      setVerifying(true);
      const token = localStorage.getItem("authToken");
      const identifier = payment.rrr || payment.reference || String(payment.id);

      const res = await fetch(`${API_BASE}/payments/remita/verify/${identifier}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.status === "success") {
        await Swal.fire({
          icon: "success",
          title: "Payment Verified",
          text: "The payment has been successfully confirmed.",
          confirmButtonColor: "#15803d",
        });
        loadPayment();
      } else {
        await Swal.fire({
          icon: "warning",
          title: "Verification Pending",
          text: data.message || "Remita reports this transaction as pending.",
          confirmButtonColor: "#ea580c",
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Verification Error",
        text: err.message || "Failed to verify payment",
      });
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-green-700" />
          <p className="mt-2 text-sm text-gray-500">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-lg font-bold text-gray-900">Error Loading Payment</h2>
          <p className="mt-1 text-sm text-gray-500">{error || "Payment not found"}</p>
          <button
            onClick={() => router.back()}
            className="mt-6 inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isConfirmed = payment.status === "confirmed" || payment.status === "paid";
  const isFailed = payment.status === "failed";
  const isPending = !isConfirmed && !isFailed;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment Details</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                ${isConfirmed ? "bg-green-100 text-green-700" : ""}
                ${isPending ? "bg-orange-100 text-orange-700" : ""}
                ${isFailed ? "bg-red-100 text-red-700" : ""}
              `}>
                {payment.status || "Pending"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Ref: {payment.reference || `ID-${payment.id}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {payment.method === "remita" && isPending && (
            <button
              onClick={handleVerifyPayment}
              disabled={verifying}
              className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${verifying ? "animate-spin" : ""}`} />
              Verify Transaction
            </button>
          )}
          <button
            onClick={handleDownloadInvoice}
            className="inline-flex items-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-800 transition-all"
          >
            <Download className="h-4 w-4" />
            Invoice
          </button>
        </div>
      </div>

      {/* RRR Spotlight - Only if present */}
      {payment.rrr && (
        <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6 text-center shadow-sm">
          <div className="flex flex-col items-center justify-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-600">Remita Retrieval Reference</span>
            <div className="flex items-center gap-3">
              <div className="text-4xl font-black tracking-[0.2em] text-orange-800 font-mono">
                {payment.rrr}
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(payment.rrr!);
                  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'RRR Copied!', showConfirmButton: false, timer: 1500 });
                }}
                className="p-1 text-orange-400 hover:text-orange-600 transition-colors"
                title="Copy RRR"
              >
                <Hash className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-orange-500 font-medium">Use this reference for payments at any bank branch or online</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Summary Card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <CreditCard className="h-4 w-4 text-green-700" />
                Transaction Summary
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</dt>
                  <dd className="mt-2 text-3xl font-bold text-gray-900 leading-none">
                    ₦{Number(payment.amountPaid).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</dt>
                  <dd className="mt-2 text-lg font-semibold text-gray-900">
                    {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("en-NG", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                  </dd>
                  <dd className="text-xs text-gray-400 mt-0.5">
                    {payment.paymentDate ? new Date(payment.paymentDate).toLocaleTimeString("en-NG", { hour: '2-digit', minute: '2-digit' }) : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Method</dt>
                  <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-900 capitalize italic">
                    <span className={`h-2 w-2 rounded-full ${payment.method === 'remita' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                    {payment.method || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Status</dt>
                  <dd className="mt-1 flex items-center gap-2 text-sm font-bold capitalize">
                    {isConfirmed ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-orange-500" />}
                    <span className={isConfirmed ? "text-green-700" : "text-orange-700"}>
                      {payment.status || "Pending"}
                    </span>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Institution & Payer Card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Building2 className="h-4 w-4 text-green-700" />
                Institution Details
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Institution Name</dt>
                    <dd className="mt-1 text-base font-semibold text-gray-900 font-serif lowercase italic">
                      {payment.assessment?.entity?.name || payment.payerName || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Code / Reference</dt>
                    <dd className="mt-1 text-sm font-mono font-medium text-gray-600">
                      {payment.assessment?.entity?.code || "N/A"}
                    </dd>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Local Government Area</dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-700 capitalize">
                      {payment.assessment?.entity?.lga || "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payer Email</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-600 lowercase">
                      {payment.payerEmail || "N/A"}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Associated Assessment Card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <FileText className="h-4 w-4 text-green-700" />
                Assessment Purpose
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="rounded-lg bg-green-50 p-3">
                  <dt className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Assessment Category</dt>
                  <dd className="mt-1 text-sm font-bold text-green-900">
                    {payment.assessment?.incomeSource?.name || "N/A"}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assessed Amount</dt>
                    <dd className="mt-1 text-sm font-bold text-gray-900">
                      ₦{Number(payment.assessment?.amountAssessed || 0).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Period</dt>
                    <dd className="mt-1 text-sm font-bold text-gray-900">
                      {payment.assessment?.assessmentPeriod || "N/A"}
                    </dd>
                  </div>
                </div>
                <Link
                  href={`/admin/assessments/${payment.assessmentId}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Full Assessment
                </Link>
              </div>
            </div>
          </div>

          {/* Recorder Info */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <ShieldCheck className="h-4 w-4 text-green-700" />
                Audit Information
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recorded By</dt>
                  <dd className="text-sm font-bold text-gray-900">
                    {payment.recorder?.name || "Online System"}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Audit */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-6 px-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <Calendar className="h-3 w-3" />
          Detail Generated On {new Date().toLocaleDateString("en-NG", { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <Hash className="h-3 w-3" />
          SYSTEM ID: PMT-{payment.id}
        </div>
      </div>
    </div>
  );
}
