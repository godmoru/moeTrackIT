"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface Assessment {
  id: number;
  entityId: number;
  entityName: string;
  entityLga?: string;
  entityCode?: string;
  incomeSourceId: number;
  incomeSourceName: string;
  assessmentPeriod: string;
  amountAssessed: number;
  amountPaid: number;
  balance: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
}

export default function PayPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);

  // Payment form state
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerName, setPayerName] = useState("");

  // Filter state for AEOs with multiple schools
  const [lgaFilter, setLgaFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");

  async function loadAssessments() {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const res = await fetch(`${API_BASE}/payments/my-assessments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load assessments");
      }

      setAssessments(data);

      // Pre-fill email from user info if available
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.email) setPayerEmail(user.email);
          if (user.name) setPayerName(user.name);
        } catch {}
      }
    } catch (err: any) {
      setError(err.message || "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssessments();
  }, []);

  function handleSelectAssessment(assessment: Assessment) {
    setSelectedAssessment(assessment);
    setPaymentAmount(assessment.balance.toString());
  }

  async function handleInitiatePayment() {
    if (!selectedAssessment) return;

    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Amount",
        text: "Please enter a valid payment amount.",
        confirmButtonColor: "#b91c1c",
      });
      return;
    }

    if (amount > selectedAssessment.balance) {
      await Swal.fire({
        icon: "warning",
        title: "Amount Exceeds Balance",
        text: `The payment amount (₦${amount.toLocaleString()}) exceeds the outstanding balance (₦${selectedAssessment.balance.toLocaleString()}).`,
        confirmButtonColor: "#b91c1c",
      });
      return;
    }

    if (!payerEmail) {
      await Swal.fire({
        icon: "error",
        title: "Email Required",
        text: "Please enter your email address for payment receipt.",
        confirmButtonColor: "#b91c1c",
      });
      return;
    }

    setProcessing(selectedAssessment.id);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE}/payments/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assessmentId: selectedAssessment.id,
          amount,
          email: payerEmail,
          name: payerName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to initialize payment");
      }

      // Redirect to Paystack checkout
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Payment Failed",
        text: err.message || "Failed to initialize payment",
        confirmButtonColor: "#b91c1c",
      });
    } finally {
      setProcessing(null);
    }
  }

  // Get unique LGAs for filter dropdown
  const uniqueLgas = [...new Set(assessments.map((a) => a.entityLga).filter(Boolean))] as string[];

  // Apply filters
  const filteredAssessments = assessments.filter((a) => {
    if (lgaFilter && a.entityLga !== lgaFilter) return false;
    if (searchFilter) {
      const search = searchFilter.toLowerCase();
      const matchesName = a.entityName?.toLowerCase().includes(search);
      const matchesCode = a.entityCode?.toLowerCase().includes(search);
      const matchesPurpose = a.incomeSourceName?.toLowerCase().includes(search);
      if (!matchesName && !matchesCode && !matchesPurpose) return false;
    }
    return true;
  });

  const pendingAssessments = filteredAssessments.filter((a) => a.balance > 0);
  const paidAssessments = filteredAssessments.filter((a) => a.balance <= 0);

  // Check if user has multiple schools (AEO)
  const hasMultipleSchools = new Set(assessments.map((a) => a.entityId)).size > 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Pay Assessments</h1>
        <p className="text-xs text-gray-500">
          View your outstanding assessments and make online payments.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-gray-600">Loading assessments...</p>}

      {!loading && !error && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Assessments List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters for AEOs with multiple schools */}
            {hasMultipleSchools && (
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Filter Schools
                </h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700">Search</label>
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="School name or code..."
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                    />
                  </div>
                  {uniqueLgas.length > 1 && (
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700">LGA</label>
                      <select
                        value={lgaFilter}
                        onChange={(e) => setLgaFilter(e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                      >
                        <option value="">All LGAs</option>
                        {uniqueLgas.map((lga) => (
                          <option key={lga} value={lga}>
                            {lga}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-[10px] text-gray-500">
                  Showing {pendingAssessments.length} outstanding from {new Set(filteredAssessments.map((a) => a.entityId)).size} schools
                </div>
              </div>
            )}

            {/* Pending Assessments */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Outstanding Assessments ({pendingAssessments.length})
              </h2>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Institution</th>
                      {hasMultipleSchools && (
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">LGA</th>
                      )}
                      <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Purpose</th>
                      <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Year</th>
                      <th className="px-3 py-2 text-right text-[11px] font-medium text-gray-500">Assessed</th>
                      <th className="px-3 py-2 text-right text-[11px] font-medium text-gray-500">Paid</th>
                      <th className="px-3 py-2 text-right text-[11px] font-medium text-gray-500">Balance</th>
                      <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {pendingAssessments.length === 0 ? (
                      <tr>
                        <td colSpan={hasMultipleSchools ? 8 : 7} className="px-3 py-4 text-center text-[11px] text-gray-500">
                          No outstanding assessments. All payments are up to date!
                        </td>
                      </tr>
                    ) : (
                      pendingAssessments.map((a) => (
                        <tr
                          key={a.id}
                          className={`hover:bg-gray-50 ${
                            selectedAssessment?.id === a.id ? "bg-green-50" : ""
                          }`}
                        >
                          <td className="px-3 py-2 text-[11px] text-gray-900">
                            <div>{a.entityName}</div>
                            {a.entityCode && (
                              <div className="text-[10px] text-gray-400">{a.entityCode}</div>
                            )}
                          </td>
                          {hasMultipleSchools && (
                            <td className="px-3 py-2 text-[11px] text-gray-600">{a.entityLga || "-"}</td>
                          )}
                          <td className="px-3 py-2 text-[11px] text-gray-700">{a.incomeSourceName}</td>
                          <td className="px-3 py-2 text-[11px] text-gray-700">{a.assessmentPeriod || "-"}</td>
                          <td className="px-3 py-2 text-right text-[11px] text-gray-700">
                            ₦{a.amountAssessed.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right text-[11px] text-green-600">
                            ₦{a.amountPaid.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right text-[11px] font-medium text-red-600">
                            ₦{a.balance.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-[11px]">
                            <button
                              type="button"
                              onClick={() => handleSelectAssessment(a)}
                              className="rounded-md bg-green-700 px-2 py-1 text-[10px] font-semibold text-white hover:bg-green-800"
                            >
                              Pay Now
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paid Assessments */}
            {paidAssessments.length > 0 && (
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Paid Assessments ({paidAssessments.length})
                </h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Institution</th>
                        {hasMultipleSchools && (
                          <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">LGA</th>
                        )}
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Purpose</th>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Year</th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-gray-500">Amount</th>
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {paidAssessments.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-[11px] text-gray-900">
                            <div>{a.entityName}</div>
                            {a.entityCode && (
                              <div className="text-[10px] text-gray-400">{a.entityCode}</div>
                            )}
                          </td>
                          {hasMultipleSchools && (
                            <td className="px-3 py-2 text-[11px] text-gray-600">{a.entityLga || "-"}</td>
                          )}
                          <td className="px-3 py-2 text-[11px] text-gray-700">{a.incomeSourceName}</td>
                          <td className="px-3 py-2 text-[11px] text-gray-700">{a.assessmentPeriod || "-"}</td>
                          <td className="px-3 py-2 text-right text-[11px] text-gray-700">
                            ₦{a.amountAssessed.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-[11px]">
                            <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                              Paid
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-lg bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Make Payment
              </h2>

              {selectedAssessment ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-md bg-gray-50 p-3">
                    <div className="text-[11px] text-gray-500">Selected Assessment</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {selectedAssessment.incomeSourceName}
                    </div>
                    <div className="text-[11px] text-gray-600">
                      {selectedAssessment.entityName} • {selectedAssessment.assessmentPeriod}
                    </div>
                    <div className="mt-2 text-lg font-bold text-red-600">
                      ₦{selectedAssessment.balance.toLocaleString()}
                      <span className="ml-1 text-[10px] font-normal text-gray-500">outstanding</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700">
                        Payment Amount (₦)
                      </label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        min="1"
                        max={selectedAssessment.balance}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                      />
                      <p className="mt-1 text-[10px] text-gray-500">
                        You can make partial payments
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={payerEmail}
                        onChange={(e) => setPayerEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-700">
                        Payer Name
                      </label>
                      <input
                        type="text"
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        placeholder="Full name"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleInitiatePayment}
                      disabled={processing === selectedAssessment.id}
                      className="w-full rounded-md bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                    >
                      {processing === selectedAssessment.id ? (
                        "Processing..."
                      ) : (
                        <>Pay ₦{Number(paymentAmount || 0).toLocaleString()}</>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedAssessment(null)}
                      className="w-full rounded-md border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="rounded-md bg-blue-50 p-3 text-[10px] text-blue-800">
                    <strong>Secure Payment:</strong> You will be redirected to Paystack to complete
                    your payment securely. We accept cards, bank transfers, and USSD.
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-center text-[11px] text-gray-500">
                  <p>Select an assessment from the list to make a payment.</p>
                  <div className="mt-4 rounded-md bg-gray-50 p-4">
                    <div className="text-2xl">💳</div>
                    <p className="mt-2 text-gray-600">
                      Click "Pay Now" on any outstanding assessment to proceed with payment.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
