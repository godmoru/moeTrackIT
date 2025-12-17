"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface VerificationResult {
  message: string;
  status: string;
  paymentId?: number;
  amount?: number;
  channel?: string;
}

function PaymentVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyPayment() {
      const reference = searchParams.get("reference") || searchParams.get("trxref");

      if (!reference) {
        setError("No payment reference found");
        setVerifying(false);
        return;
      }

      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("You are not authenticated. Please log in again.");
        }

        const res = await fetch(`${API_BASE}/payments/verify/${encodeURIComponent(reference)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to verify payment");
        }

        setResult(data);
      } catch (err: any) {
        setError(err.message || "Failed to verify payment");
      } finally {
        setVerifying(false);
      }
    }

    verifyPayment();
  }, [searchParams]);

  if (verifying) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-green-200 border-t-green-700"></div>
          <p className="mt-4 text-sm text-gray-600">Verifying your payment...</p>
          <p className="mt-1 text-xs text-gray-500">Please wait, do not close this page.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Verification Failed</h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/admin/pay"
              className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              Try Again
            </Link>
            <Link
              href="/admin/payments"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Payments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = result?.status === "success";

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        {isSuccess ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Payment Successful!</h2>
            <p className="mt-2 text-sm text-gray-600">{result?.message}</p>
            
            {result?.amount && (
              <div className="mt-4 rounded-md bg-green-50 p-4">
                <div className="text-2xl font-bold text-green-700">
                  ₦{result.amount.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-green-600">
                  Paid via {result.channel || "Online Payment"}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/admin/payments"
                className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
              >
                View Payment History
              </Link>
              <Link
                href="/admin/pay"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Pay Another
              </Link>
            </div>

            {result?.paymentId && (
              <div className="mt-4">
                <a
                  href={`${API_BASE}/payments/${result.paymentId}/invoice.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-700 hover:underline"
                >
                  Download Receipt →
                </a>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Payment Not Completed</h2>
            <p className="mt-2 text-sm text-gray-600">
              {result?.message || "Your payment was not successful. Please try again."}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Status: {result?.status || "Unknown"}
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/admin/pay"
                className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
              >
                Try Again
              </Link>
              <Link
                href="/admin/dashboard"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Go to Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-green-200 border-t-green-700"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PaymentVerifyContent />
    </Suspense>
  );
}
