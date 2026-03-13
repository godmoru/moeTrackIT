"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

// Add Remita Type definition stub
declare global {
  interface Window {
    RmPaymentEngine: any;
  }
}

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
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "remita">("remita");
  const [paymentData, setPaymentData] = useState<any>(null); // Store payment init response

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
        } catch { }
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
    setPaymentData(null); // Reset payment data when selecting new assessment
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

      // Choose endpoint key based on method
      const endpoint = paymentMethod === "remita"
        ? `${API_BASE}/payments/remita/initialize`
        : `${API_BASE}/payments/initialize`;

      const res = await fetch(endpoint, {
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

      // Store payment data for display
      setPaymentData(data);

      // DEBUG: Log the full response
      console.log('DEBUG: Backend Response:', data);
      console.log('DEBUG: RRR from backend:', data.rrr);

      if (paymentMethod === "remita") {
        // Remita Inline Flow (v2)
        if (data.isInline && data.publicKey && data.orderId) {

          // Show RRR first before opening widget
          if (data.rrr) {
            await Swal.fire({
              icon: 'info',
              title: 'Remita Payment Reference',
              html: `
                <div class="text-center">
                  <p class="text-sm text-gray-600 mb-3">Your Remita Retrieval Reference (RRR):</p>
                  <div class="bg-orange-100 p-4 rounded-lg border-2 border-orange-300 mb-3">
                    <div class="font-mono text-2xl font-bold text-orange-700 tracking-widest">
                      ${data.rrr}
                    </div>
                  </div>
                  <p class="text-xs text-orange-600">Save this number for your records</p>
                  <p class="text-xs text-gray-500 mt-2">Click OK to proceed to payment</p>
                </div>
              `,
              confirmButtonText: 'Proceed to Payment',
              confirmButtonColor: '#ea580c',
              allowOutsideClick: false
            });
          }

          // Load Remita Inline Script if not present
          if (!window.RmPaymentEngine) {
            const script = document.createElement('script');
            // Using the modern demo domain
            script.src = "https://remitademo.net/payment/v1/remita-pay-inline.bundle.js";
            script.async = true;
            document.body.appendChild(script);

            await new Promise((resolve) => script.onload = resolve);
          }

          // Prepare config exactly as specified in "Checkout with Remita Invoice (RRR)" doc
          const config: any = {
            key: data.publicKey?.trim(),
            processRrr: true,
            transactionId: data.rrr, // This must be the RRR generated from backend
            amount: Number(paymentAmount),
            email: data.remitaParams?.email,
            firstName: data.remitaParams?.firstName,
            lastName: data.remitaParams?.lastName,
            narration: data.remitaParams?.narration,
            extendedData: {
              customFields: [
                { name: "rrr", value: data.rrr },
                { name: "orderId", value: String(data.orderId) }
              ]
            },
            onSuccess: async function (response: any) {
              console.log('Remita Success Callback Response:', response);
              // In "Checkout with RRR" mode, the transactionId/paymentReference IS the RRR
              const rrr = response.paymentReference || response.transactionId || response.RRR || response.rrr || data.rrr;
              const idToVerify = rrr;

              await Swal.fire({
                icon: 'info',
                title: 'Payment Processing',
                html: `
                  <div class="text-left">
                    <p class="mb-2"><strong>Payment Verification:</strong></p>
                    <div class="bg-orange-50 p-2 rounded text-center font-mono text-lg font-bold text-orange-700 mb-3">
                      ${idToVerify}
                    </div>
                    <p class="text-xs text-gray-500 mt-3">Verifying payment status...</p>
                  </div>
                `,
                showConfirmButton: false,
                allowOutsideClick: false,
                timer: 3000,
                timerProgressBar: true
              });

              verifyRemitaTransaction(idToVerify, idToVerify);
            },
            onError: function (response: any) {
              console.log('Remita Error:', response);
              Swal.fire({ title: 'Payment Error', text: 'Transaction failed or cancelled', icon: 'error' });
            },
            onClose: function () {
              console.log('Remita Window Closed');
            }
          };

          console.log('DEBUG: Final Remita Config being passed to widget:', JSON.stringify(config, null, 2));
          const paymentEngine = window.RmPaymentEngine.init(config);

          paymentEngine.showPaymentWidget();
          // We don't close the modal or refresh immediately; we wait for onSuccess callback

        } else if (data.rrr) {
          // Legacy RRR Flow (Fallback if backend not updated fully or using hybrid)
          await Swal.fire({
            icon: "success",
            title: "RRR Generated Successfully",
            html: `
              <div class="text-left">
                <p class="mb-2">Your Remita Retrieval Reference (RRR) is:</p>
                <div class="bg-gray-100 p-3 rounded-lg text-center text-xl font-bold tracking-wider select-all cursor-pointer mb-4" onclick="navigator.clipboard.writeText('${data.rrr}'); Swal.showToast({ title: 'Copied!', icon: 'success' })">
                  ${data.rrr}
                </div>
                <p class="text-sm text-gray-600 mb-4">
                  Please proceed to any bank branch with this RRR or pay online using Remita.
                </p>
                <a href="https://remita.net/pay-bills" target="_blank" rel="noopener noreferrer" 
                   class="block w-full text-center bg-orange-600 text-white rounded-md px-4 py-2 font-medium hover:bg-orange-700">
                  Complete Payment on Remita
                </a>
              </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
          });
          loadAssessments();
          setSelectedAssessment(null);
        } else {
          throw new Error("Invalid Remita initialization response");
        }
      } else {
        // Paystack Flow
        if (data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
        } else {
          throw new Error("No payment URL received");
        }
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

  // Define verification function outside or inside component
  async function verifyRemitaTransaction(transactionId: string, rrr?: string) {
    try {
      const token = localStorage.getItem("authToken");
      const url = rrr
        ? `${API_BASE}/payments/remita/verify/${transactionId}?rrr=${rrr}`
        : `${API_BASE}/payments/remita/verify/${transactionId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.status === 'success') {
        await Swal.fire({
          icon: 'success',
          title: 'Payment Successful',
          text: 'Your payment has been confirmed provided.',
          confirmButtonColor: '#15803d'
        });
        loadAssessments();
        setSelectedAssessment(null);
      } else {
        throw new Error(data.message || 'Payment verification failed');
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: err.message || 'Could not verify payment status'
      });
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
                          className={`hover:bg-gray-50 ${selectedAssessment?.id === a.id ? "bg-green-50" : ""
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

                    {/* Payment Gateway Selector */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-2">
                        Payment Gateway
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Remita Option */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("remita")}
                          className={`flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all ${paymentMethod === "remita"
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50"
                            }`}
                        >
                          <span className="text-lg font-bold text-orange-600">R</span>
                          <span className="mt-0.5 text-[10px] font-semibold text-gray-700">Remita</span>
                          {paymentMethod === "remita" && (
                            <span className="mt-1 inline-flex items-center rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-medium text-orange-700">
                              ✓ Selected
                            </span>
                          )}
                        </button>

                        {/* Paystack Option */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("paystack")}
                          className={`flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all ${paymentMethod === "paystack"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                            }`}
                        >
                          <span className="text-lg font-bold text-blue-600">P</span>
                          <span className="mt-0.5 text-[10px] font-semibold text-gray-700">Paystack</span>
                          {paymentMethod === "paystack" && (
                            <span className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">
                              ✓ Selected
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Display RRR after payment initialization */}
                    {paymentData && paymentMethod === "remita" && paymentData.rrr && (
                      <div className="bg-orange-100 p-4 rounded-lg border-2 border-orange-300 text-center shadow-sm">
                        <div className="text-[11px] text-orange-800 font-bold mb-2 uppercase tracking-tight">Payment Reference (RRR)</div>
                        <div
                          className="font-mono text-2xl font-bold text-orange-700 tracking-[0.2em] bg-white/50 py-2 rounded border border-orange-200 cursor-pointer hover:bg-white transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(paymentData.rrr);
                            Swal.fire({
                              toast: true,
                              position: 'top-end',
                              icon: 'success',
                              title: 'RRR Copied to clipboard',
                              showConfirmButton: false,
                              timer: 2000
                            });
                          }}
                          title="Click to copy RRR"
                        >
                          {paymentData.rrr}
                        </div>
                        <div className="text-[10px] text-orange-600 mt-2 font-medium italic">Click the number above to copy</div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleInitiatePayment}
                      disabled={processing === selectedAssessment.id}
                      className="w-full rounded-md bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                    >
                      {processing === selectedAssessment.id ? (
                        "Processing..."
                      ) : (
                        <>
                          Pay ₦{Number(paymentAmount || 0).toLocaleString()}
                          {paymentData?.rrr && <span className="block text-[10px] opacity-80 font-normal mt-0.5">RRR: {paymentData.rrr}</span>}
                        </>
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

                  {/* Full Payment Details after initialization */}
                  {paymentData && paymentMethod === "remita" && (
                    <div className="rounded-md bg-orange-50 p-4 border border-orange-200 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2">
                      <div className="text-[12px] font-bold text-orange-800 mb-3 border-b border-orange-200 pb-1">Payment Information</div>
                      <div className="space-y-3">
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-orange-600 font-bold">Narration / Purpose</span>
                          <span className="block mt-1 text-[11px] font-semibold text-gray-900 leading-relaxed">
                            {paymentData.remitaParams?.narration || 'Payment for Assessment'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-white/40 p-2 rounded">
                          <span className="text-[11px] text-gray-600 font-medium">Total Amount:</span>
                          <span className="font-bold text-gray-900 text-sm">
                            ₦{Number(paymentData.remitaParams?.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-md bg-blue-50 p-3 text-[10px] text-blue-800">
                    <strong>Secure Payment:</strong> You will be redirected to complete your payment securely via {paymentMethod === 'remita' ? 'Remita' : 'Paystack'}.
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
