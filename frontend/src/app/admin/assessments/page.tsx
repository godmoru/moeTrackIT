"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/ui/DataTable";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

const CURRENT_YEAR = new Date().getFullYear();
const DYNAMIC_YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 3 + i);

interface Assessment {
  id: number;
  amountAssessed: string | number;
  status: string;
  assessmentPeriod: string | null;
  entity?: { name: string };
  incomeSource?: { name: string };
}

interface EntityOption {
  id: number;
  name: string;
  entityTypeId?: number;
}

interface EntityTypeOption {
  id: number;
  name: string;
}

interface IncomeSourceParameterOption {
  key: string;
  label: string;
  dataType: string; // 'number' | 'enum' | 'boolean'
  required: boolean;
  options: any; // stringified json or object
  calculationRole?: string;
}

interface IncomeSourceOption {
  id: number;
  name: string;
  category?: string;
  recurrence?: string;
  parameters?: IncomeSourceParameterOption[];
}

export default function AssessmentsPage() {
  const [items, setItems] = useState<Assessment[]>([]);
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityTypeOption[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSourceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIncomeSourceId, setActiveIncomeSourceId] = useState<number | "all">("all");
  const [activeYear, setActiveYear] = useState<string | "all">("all");

  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [savingNewAssessment, setSavingNewAssessment] = useState(false);
  const [newAssessment, setNewAssessment] = useState<{
    entityId: string;
    incomeSourceId: string;
    assessmentYear: string;
    assessmentTerm: string;
    dueDate: string;
    parameterValues: Record<string, any>;
  }>({
    entityId: "",
    incomeSourceId: "",
    assessmentYear: new Date().getFullYear().toString(),
    assessmentTerm: "",
    dueDate: "",
    parameterValues: {},
  });


  const [showBulkLicense, setShowBulkLicense] = useState(false);
  const [savingBulkLicense, setSavingBulkLicense] = useState(false);
  const [bulkForm, setBulkForm] = useState<{
    incomeSourceId: string;
    assessmentYear: string;
    assessmentTerm: string;
    parameterValues: Record<string, any>;
    dueDate: string;
    onlyActive: boolean;
  }>({
    incomeSourceId: "",
    assessmentYear: new Date().getFullYear().toString(),
    assessmentTerm: "",
    parameterValues: {},
    dueDate: "",
    onlyActive: true,
  });

  const [bulkEntityTypeFilter, setBulkEntityTypeFilter] = useState<string>("");
  const [selectedEntityIds, setSelectedEntityIds] = useState<Set<number>>(new Set());
  const { hasRole } = useAuth();
  const canCreateAssessment = hasRole(['super_admin', 'admin', 'hq_cashier']);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAssessment, setPaymentAssessment] = useState<Assessment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerName, setPayerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "remita">("remita");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

      const [assessmentsRes, entitiesRes, incomeSourcesRes, entityTypesRes] = await Promise.all([
        fetch(`${API_BASE}/assessments`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
        fetch(`${API_BASE}/institutions`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
        fetch(`${API_BASE}/income-sources`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
        fetch(`${API_BASE}/institution-types`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
      ]);

      if (!assessmentsRes.ok || !entitiesRes.ok || !incomeSourcesRes.ok || !entityTypesRes.ok) {
        const body = await assessmentsRes.json().catch(() => ({}));
        throw new Error(body.message || "Failed to load data");
      }

      const assessmentsBody = await assessmentsRes.json();
      const entitiesBody = await entitiesRes.json();
      const incomeSourcesBody = await incomeSourcesRes.json();
      const entityTypesBody = await entityTypesRes.json();

      setItems(assessmentsBody.items || []);
      setEntities(entitiesBody);
      setIncomeSources(incomeSourcesBody);
      setEntityTypes(entityTypesBody);
    } catch (err: any) {
      setError(err.message || "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }



  async function submitMassAssessment() {
    // Basic validation: Check if income source is selected
    if (!bulkForm.incomeSourceId) {
      await Swal.fire({
        icon: "error",
        title: "Missing fields",
        text: "Income Source is required.",
        confirmButtonColor: "#b91c1c",
      });
      return;
    }

    if (selectedEntityIds.size === 0) {
      await Swal.fire({
        icon: "error",
        title: "No institutions selected",
        text: "Please select at least one institution to apply the assessment to.",
        confirmButtonColor: "#b91c1c",
      });
      return;
    }

    const incomeSourceId = Number(bulkForm.incomeSourceId);
    if (Number.isNaN(incomeSourceId)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Income Source",
        text: "Please select a valid Income Source.",
        confirmButtonColor: "#b91c1c",
      });
      return;
    }

    setSavingBulkLicense(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const res = await fetch(`${API_BASE}/assessments/bulk-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          incomeSourceId,
          assessmentYear: Number(bulkForm.assessmentYear),
          assessmentTerm: bulkForm.assessmentTerm ? Number(bulkForm.assessmentTerm) : null,
          parameterValues: {
            ...bulkForm.parameterValues,
          },
          dueDate: bulkForm.dueDate || null,
          entityIds: Array.from(selectedEntityIds),
        }),

      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Failed to run bulk assessments");
      }

      await Swal.fire({
        icon: "success",
        title: "Completed",
        text: `Created ${body.createdCount || 0} assessments, skipped ${body.skippedCount || 0} entities.`,
        confirmButtonColor: "#15803d",
      });

      setShowBulkLicense(false);
      await load();
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to run mass assessment",
        confirmButtonColor: "#b91c1c",
      });
    } finally {
      setSavingBulkLicense(false);
    }
  }

  function handleCreate() {
    setNewAssessment({
      entityId: "",
      incomeSourceId: "",
      assessmentYear: new Date().getFullYear().toString(),
      assessmentTerm: "",
      dueDate: "",
      parameterValues: {},
    });

    setShowNewAssessment(true);
  }



  async function submitNewAssessment() {
    const { entityId, incomeSourceId, assessmentYear, assessmentTerm, dueDate, parameterValues } = newAssessment;

    if (!entityId || !incomeSourceId) {
      await Swal.fire({
        icon: "error",
        title: "Missing fields",
        text: "Institution and Income Source are required.",
        confirmButtonColor: "#b91c1c",
      });
      return;
    }

    const entityIdNum = Number(entityId);
    const incomeSourceIdNum = Number(incomeSourceId);
    if (Number.isNaN(entityIdNum) || Number.isNaN(incomeSourceIdNum)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid values",
        text: "Please select valid Institution and Income Source.",
        confirmButtonColor: "#b91c1c",
      });
      return;
    }

    setSavingNewAssessment(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const res = await fetch(`${API_BASE}/assessments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          entityId: entityIdNum,
          incomeSourceId: incomeSourceIdNum,
          assessmentYear: Number(newAssessment.assessmentYear),
          assessmentTerm: newAssessment.assessmentTerm ? Number(newAssessment.assessmentTerm) : null,
          dueDate: dueDate || null,
          parameterValues: {
            ...parameterValues,
          },
          status: "pending",
        }),

      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to create assessment");
      }

      await Swal.fire({
        icon: "success",
        title: "Created",
        text: "Assessment created successfully.",
        confirmButtonColor: "#15803d",
      });

      setShowNewAssessment(false);
      await load();
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to create assessment",
        confirmButtonColor: "#b91c1c",
      });
    } finally {
      setSavingNewAssessment(false);
    }
  }

  function openPaymentModal(assessment: Assessment) {
    setPaymentAssessment(assessment);
    setPaymentAmount(String(assessment.amountAssessed));
    setPaymentMethod("remita");

    if (assessment.entity?.name) {
      setPayerName(assessment.entity.name);
    }

    setShowPaymentModal(true);
  }

  async function handleInitiatePayment() {
    if (!paymentAssessment) return;

    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      await Swal.fire({ icon: "error", text: "Invalid Amount" });
      return;
    }
    if (!payerEmail) {
      await Swal.fire({ icon: "error", text: "Email is required for receipt" });
      return;
    }

    setProcessingPayment(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Not authenticated");

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
          assessmentId: paymentAssessment.id,
          amount,
          email: payerEmail,
          name: payerName,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Payment init failed");

      setPaymentData(body);

      if (paymentMethod === "remita") {
        // Remita Inline Flow (v2)
        if (body.isInline && body.publicKey && body.orderId) {

          // Load Remita Inline Script if not present
          if (!window.RmPaymentEngine) {
            const script = document.createElement('script');
            // Use demo or live URL based on env, but typically:
            // Demo: https://remitademo.net/payment/v1/remita-pay-inline.bundle.js
            // Live: https://login.remita.net/payment/v1/remita-pay-inline.bundle.js
            script.src = "https://remitademo.net/payment/v1/remita-pay-inline.bundle.js";
            script.async = true;
            document.body.appendChild(script);

            await new Promise((resolve) => script.onload = resolve);
          }

          const narrationWithRrr = body.remitaParams?.narration || `RRR: ${body.rrr} - Payment for Assessment`;

          const config = {
            key: body.publicKey,
            transactionId: body.rrr, // Set RRR as transaction identifier to display it
            rrr: body.rrr,
            processRrr: true,
            title: `RRR: ${body.rrr}`, // Experimental: override header
            paymentTitle: `RRR: ${body.rrr}`, // Experimental: override header
            amount: body.remitaParams?.amount,
            email: body.remitaParams?.email,
            first_name: body.remitaParams?.firstName,
            last_name: body.remitaParams?.lastName,
            narration: narrationWithRrr,
            description: narrationWithRrr,
            extendedData: {
              customFields: [
                { name: "rrr", value: body.rrr },
                { name: "narration", value: narrationWithRrr },
                { name: "orderId", value: String(body.orderId) }
              ]
            },
            onSuccess: async function (response: any) {
              console.log('Remita Success Callback Response:', response);
              // Priority: RRR from response -> initial body.rrr -> transactionId
              const rrr = response.RRR || response.rrr || body.rrr || response.transactionId;
              const paymentRef = response.paymentReference;

              await Swal.fire({
                icon: 'info',
                title: 'Payment Processing',
                html: `
                  <div class="text-left">
                    <p class="mb-2"><strong>Remita Retrieval Reference (RRR):</strong></p>
                    <div class="bg-orange-50 p-2 rounded text-center font-mono text-lg font-bold text-orange-700 mb-3">
                      ${rrr || 'N/A'}
                    </div>
                    <p class="text-sm text-gray-600 mb-1"><strong>Payment Reference:</strong> ${paymentRef || 'N/A'}</p>
                    <p class="text-xs text-gray-500 mt-3">Verifying payment status...</p>
                  </div>
                `,
                showConfirmButton: false,
                allowOutsideClick: false,
                timer: 3000,
                timerProgressBar: true
              });

              verifyRemitaTransaction(rrr || String(body.orderId), paymentRef);
            },
            onError: function (response: any) {
              console.log('Remita Error:', response);
              Swal.fire({ title: 'Payment Error', text: 'Transaction failed or cancelled', icon: 'error' });
            },
            onClose: function () {
              console.log('Remita Window Closed');
            }
          };

          console.log('DEBUG: Final Remita Config for Assessments Page:', JSON.stringify(config, null, 2));
          const paymentEngine = window.RmPaymentEngine.init(config);

          // ...
          paymentEngine.showPaymentWidget();
          // We don't close the modal or refresh immediately; we wait for onSuccess callback

        } else if (body.rrr) {
          setShowPaymentModal(false);
          await Swal.fire({
            icon: "success",
            title: "RRR Generated",
            html: `
              <p>RRR: <strong>${body.rrr}</strong></p>
              <p class="text-sm mt-2">Use this RRR to pay via Bank Branch or Remita Online.</p>
              <a href="https://remita.net/pay-bills" target="_blank" class="block mt-4 bg-orange-600 text-white rounded px-4 py-2">Pay on Remita</a>
            `,
          });
          load();
        } else {
          throw new Error("Invalid Remita initialization response");
        }
      } else {
        if (body.authorizationUrl) {
          window.location.href = body.authorizationUrl;
        }
      }
    } catch (err: any) {
      await Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setProcessingPayment(false);
    }
  }

  // Verification Logic
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
        setShowPaymentModal(false);
        await Swal.fire({
          icon: 'success',
          title: 'Payment Successful',
          text: 'Your payment has been confirmed.',
          confirmButtonColor: '#15803d'
        });
        load();
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

  async function handleExport() {
    try {
      const token = localStorage.getItem("authToken");
      
      const params = new URLSearchParams();
      if (activeIncomeSourceId !== "all") params.append("incomeSourceId", String(activeIncomeSourceId));
      if (activeYear !== "all") params.append("assessmentYear", activeYear);
      
      const url = `${API_BASE}/reports/assessments.xlsx?${params.toString()}`;
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `assessments-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: err.message || "Failed to export assessments"
      });
    }
  }

  async function handleExportPdf() {
    try {
      const token = localStorage.getItem("authToken");
      
      const params = new URLSearchParams();
      if (activeIncomeSourceId !== "all") params.append("incomeSourceId", String(activeIncomeSourceId));
      if (activeYear !== "all") params.append("assessmentYear", activeYear);
      
      const url = `${API_BASE}/reports/assessments.pdf?${params.toString()}`;
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `assessments-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: err.message || "Failed to export assessments"
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const incomeSourceTabs: (IncomeSourceOption & { key: string })[] = [
    { id: -1, name: "All Sources", key: "all" },
    ...incomeSources.map((s) => ({ ...s, key: String(s.id) })),
  ];

  const filteredBySource = items.filter((a) => {
    if (activeIncomeSourceId === "all") return true;
    return a.incomeSource && a.incomeSource.name
      ? incomeSources.find((s) => s.id === activeIncomeSourceId)?.name ===
      a.incomeSource.name
      : false;
  });

  const allYearsSet = new Set<string>();
  filteredBySource.forEach((a) => {
    if (a.assessmentPeriod) allYearsSet.add(a.assessmentPeriod.toString());
  });
  const allYears = Array.from(allYearsSet).sort((a, b) => b.localeCompare(a));

  const filteredItems = filteredBySource.filter((a) => {
    if (activeYear === "all") return true;
    return (a.assessmentPeriod || "").toString() === activeYear;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Assessments</h1>
        <div className="flex gap-2">

          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12 a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showExportDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowExportDropdown(false)}
                  ></div>
                  <div className="absolute right-0 mt-1 w-32 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleExport();
                          setShowExportDropdown(false);
                        }}
                        className="flex w-full items-center px-4 py-2 text-[11px] text-gray-700 hover:bg-gray-100"
                      >
                        Excel Spreadsheet
                      </button>
                      <button
                        onClick={() => {
                          handleExportPdf();
                          setShowExportDropdown(false);
                        }}
                        className="flex w-full items-center px-4 py-2 text-[11px] text-gray-700 hover:bg-gray-100"
                      >
                        PDF Document
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {canCreateAssessment && (
              <>
                <button
                  onClick={() => {
                    setBulkForm({
                      incomeSourceId: "",
                      assessmentYear: new Date().getFullYear().toString(),
                      assessmentTerm: "",
                      parameterValues: {},
                      dueDate: "",
                      onlyActive: true,
                    });

                    setBulkEntityTypeFilter("");
                    setSelectedEntityIds(new Set());
                    setShowBulkLicense(true);
                  }}
                  className="rounded-md border border-green-700 px-3 py-2 text-[11px] font-semibold text-green-700 hover:bg-green-50"
                >
                  Mass Assessment
                </button>
                <button
                  onClick={handleCreate}
                  className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
                >
                  New Assessment
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading assessments...</p>}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <div className="flex gap-2 border-b border-gray-200 text-xs">
            {incomeSourceTabs.map((s) => {
              const isAll = s.key === "all";
              const id = isAll ? "all" : (s.id as number);
              const isActive = activeIncomeSourceId === id;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setActiveIncomeSourceId(id);
                    setActiveYear("all");
                  }}
                  className={`border-b-2 px-3 py-2 font-medium ${isActive
                    ? "border-green-700 text-green-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3 text-[11px]">
            <span className="font-medium text-gray-600">Year:</span>
            <button
              type="button"
              onClick={() => setActiveYear("all")}
              className={`rounded-full border px-2 py-1 ${activeYear === "all"
                ? "border-green-700 bg-green-50 text-green-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
            >
              All
            </button>
            {allYears.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setActiveYear(y)}
                className={`rounded-full border px-2 py-1 ${activeYear === y
                  ? "border-green-700 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {y}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <DataTable
              data={filteredItems}
              columns={[
                {
                  header: "S/No",
                  cell: (a, index) => <span className="text-xs">{index + 1}</span>
                },
                {
                  header: "Institution",
                  cell: (a) => <span className="text-xs">{a.entity?.name || "-"}</span>
                },
                {
                  header: "Income Source",
                  cell: (a) => <span className="text-xs">{a.incomeSource?.name || "-"}</span>
                },
                {
                  header: "Amount (NGN)",
                  cell: (a) => <span className="text-xs">{Number(a.amountAssessed || 0).toLocaleString("en-NG")}</span>
                },
                {
                  header: "Status",
                  cell: (a) => (
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${a.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                      {a.status || "-"}
                    </span>
                  )
                },
                {
                  header: "Period",
                  cell: (a) => <span className="text-xs">{a.assessmentPeriod || "-"}</span>
                },
                {
                  header: <div className="text-right">Action</div>,
                  cell: (a) => (
                    <div className="flex items-center justify-end gap-2 text-right">
                      <Link
                        href={`/admin/assessments/${a.id}`}
                        className="rounded border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-700 hover:bg-gray-50 hover:text-green-700"
                      >
                        View
                      </Link>
                      {a.status !== 'paid' && (
                        <button
                          onClick={() => openPaymentModal(a)}
                          className="rounded bg-green-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-green-700"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  )
                }
              ]}
            />
          </div>
        </>
      )}
      <Modal
        open={showNewAssessment}
        onClose={() => {
          if (!savingNewAssessment) setShowNewAssessment(false);
        }}
        title="New Assessment"
        size="lg"
      >
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Entity
              </label>
              <select
                value={newAssessment.entityId}
                onChange={(e) =>
                  setNewAssessment((prev) => ({
                    ...prev,
                    entityId: e.target.value,
                  }))
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="">-- Select Institution --</option>
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Income Source
              </label>
              <select
                value={newAssessment.incomeSourceId}
                onChange={(e) =>
                  setNewAssessment((prev) => ({
                    ...prev,
                    incomeSourceId: e.target.value,
                  }))
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="">-- Select Income Source --</option>
                {incomeSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const selectedSource = incomeSources.find(
                (s) => String(s.id) === newAssessment.incomeSourceId
              );

              return (
                <>
                  <div className="space-y-1 md:col-span-1">
                    <label className="block text-xs font-medium text-gray-700">
                      Assessment Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newAssessment.assessmentYear}
                      onChange={(e) => setNewAssessment(prev => ({ ...prev, assessmentYear: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                    >
                      {DYNAMIC_YEARS.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  {selectedSource?.recurrence !== "yearly" && (
                    <div className="space-y-1 md:col-span-1">
                      <label className="block text-xs font-medium text-gray-700">
                        Assessment Term <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={newAssessment.assessmentTerm}
                        onChange={(e) => setNewAssessment(prev => ({ ...prev, assessmentTerm: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      >
                        <option value="">-- Select Term --</option>
                        <option value="1">First Term</option>
                        <option value="2">Second Term</option>
                        <option value="3">Third Term</option>
                      </select>
                    </div>
                  )}
                </>
              );
            })()}


            {/* Dynamic Parameters */}
            {(() => {
              const selectedSource = incomeSources.find(
                (s) => String(s.id) === newAssessment.incomeSourceId
              );
              if (!selectedSource || !selectedSource.parameters) return null;

              return selectedSource.parameters
                .filter(p => {
                  const keyLow = p.key.toLowerCase();
                  const labelLow = p.label.toLowerCase();
                  return !keyLow.includes('year') && !labelLow.includes('year') && !keyLow.includes('term') && !labelLow.includes('term');
                })
                .map((param) => {
                let optionsData: any = null;
                if (param.options) {
                  try {
                    optionsData =
                      typeof param.options === "string"
                        ? JSON.parse(param.options)
                        : param.options;
                  } catch (e) {
                    console.error("Failed to parse options for", param.key);
                  }
                }

                return (
                  <div key={param.key} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {param.label} {param.required && <span className="text-red-500">*</span>}
                    </label>
                    {param.dataType === "enum" && optionsData?.values ? (
                      <select
                        required={param.required}
                        value={newAssessment.parameterValues[param.key] || ""}
                        onChange={(e) =>
                          setNewAssessment((prev) => ({
                            ...prev,
                            parameterValues: {
                              ...prev.parameterValues,
                              [param.key]: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      >
                        <option value="">-- Select {param.label} --</option>
                        {optionsData.values.map((val: string) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required={param.required}
                        type={param.dataType === "number" ? "number" : "text"}
                        value={newAssessment.parameterValues[param.key] || ""}
                        onChange={(e) =>
                          setNewAssessment((prev) => ({
                            ...prev,
                            parameterValues: {
                              ...prev.parameterValues,
                              [param.key]: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      />
                    )}
                  </div>
                );
              });
            })()}

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Due Date
              </label>
              <input
                value={newAssessment.dueDate}
                onChange={(e) =>
                  setNewAssessment((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                if (!savingNewAssessment) setShowNewAssessment(false);
              }}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitNewAssessment}
              disabled={savingNewAssessment}
              className="rounded-md bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-70"
            >
              {savingNewAssessment ? "Creating..." : "Create Assessment"}
            </button>
          </div>
        </div >
      </Modal >

      <Modal
        open={showBulkLicense}
        onClose={() => {
          if (!savingBulkLicense) setShowBulkLicense(false);
        }}
        title="Run Mass Assessment"
        size="lg"
      >
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Income Source
              </label>
              <select
                value={bulkForm.incomeSourceId}
                onChange={(e) =>
                  setBulkForm((prev) => ({
                    ...prev,
                    incomeSourceId: e.target.value,
                  }))
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="">-- Select Income Source --</option>
                {incomeSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const selectedSource = incomeSources.find(
                (s) => String(s.id) === bulkForm.incomeSourceId
              );

              return (
                <>
                  <div className="space-y-1 md:col-span-1">
                    <label className="block text-xs font-medium text-gray-700">
                      Assessment Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bulkForm.assessmentYear}
                      onChange={(e) => setBulkForm(prev => ({ ...prev, assessmentYear: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                    >
                      {DYNAMIC_YEARS.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  {selectedSource?.recurrence !== "yearly" && (
                    <div className="space-y-1 md:col-span-1">
                      <label className="block text-xs font-medium text-gray-700">
                        Assessment Term <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={bulkForm.assessmentTerm}
                        onChange={(e) => setBulkForm(prev => ({ ...prev, assessmentTerm: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      >
                        <option value="">-- Select Term --</option>
                        <option value="1">First Term</option>
                        <option value="2">Second Term</option>
                        <option value="3">Third Term</option>
                      </select>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Dynamic Parameters for Mass Assessment */}
            {(() => {
              const selectedSource = incomeSources.find(
                (s) => String(s.id) === bulkForm.incomeSourceId
              );
              if (!selectedSource || !selectedSource.parameters) return null;

              return selectedSource.parameters
                .filter(p => {
                  const keyLow = p.key.toLowerCase();
                  const labelLow = p.label.toLowerCase();
                  return !keyLow.includes('year') && !labelLow.includes('year') && !keyLow.includes('term') && !labelLow.includes('term');
                })
                .map((param) => {
                let optionsData: any = null;
                if (param.options) {
                  try {
                    optionsData =
                      typeof param.options === "string"
                        ? JSON.parse(param.options)
                        : param.options;
                  } catch (e) {
                    console.error("Failed to parse options for", param.key);
                  }
                }

                return (
                  <div key={param.key} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {param.label} {param.required && <span className="text-red-500">*</span>}
                    </label>
                    {param.dataType === "enum" && optionsData?.values ? (
                      <select
                        required={param.required}
                        value={bulkForm.parameterValues[param.key] || ""}
                        onChange={(e) =>
                          setBulkForm((prev) => ({
                            ...prev,
                            parameterValues: {
                              ...prev.parameterValues,
                              [param.key]: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      >
                        <option value="">-- Select {param.label} --</option>
                        {optionsData.values.map((val: string) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required={param.required}
                        type={param.dataType === "number" ? "number" : "text"}
                        value={bulkForm.parameterValues[param.key] || ""}
                        onChange={(e) =>
                          setBulkForm((prev) => ({
                            ...prev,
                            parameterValues: {
                              ...prev.parameterValues,
                              [param.key]: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                      />
                    )}
                  </div>
                );
              });
            })()}

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Due Date
              </label>
              <input
                value={bulkForm.dueDate}
                onChange={(e) =>
                  setBulkForm((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Filter by Institution Type
              </label>
              <select
                value={bulkEntityTypeFilter}
                onChange={(e) => {
                  setBulkEntityTypeFilter(e.target.value);
                  setSelectedEntityIds(new Set());
                }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="">-- All Types --</option>
                {entityTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Institution selection with checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-700">
                Select Institutions
              </label>
              <span className="text-[10px] text-gray-500">
                {selectedEntityIds.size} selected
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2">
              {(() => {
                const filteredEntities = bulkEntityTypeFilter
                  ? entities.filter(
                    (e) => e.entityTypeId === Number(bulkEntityTypeFilter)
                  )
                  : entities;

                if (filteredEntities.length === 0) {
                  return (
                    <p className="py-2 text-center text-[11px] text-gray-500">
                      No institutions found for the selected type.
                    </p>
                  );
                }

                return (
                  <>
                    <div className="mb-2 flex gap-2 border-b border-gray-200 pb-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = new Set(filteredEntities.map((e) => e.id));
                          setSelectedEntityIds(allIds);
                        }}
                        className="text-[10px] font-medium text-green-700 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedEntityIds(new Set())}
                        className="text-[10px] font-medium text-gray-600 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-1">
                      {filteredEntities.map((entity) => (
                        <label
                          key={entity.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-gray-100"
                        >
                          <input
                            type="checkbox"
                            checked={selectedEntityIds.has(entity.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedEntityIds);
                              if (e.target.checked) {
                                newSet.add(entity.id);
                              } else {
                                newSet.delete(entity.id);
                              }
                              setSelectedEntityIds(newSet);
                            }}
                            className="h-3 w-3 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-[11px] text-gray-800">
                            {entity.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                if (!savingBulkLicense) setShowBulkLicense(false);
              }}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitMassAssessment}
              disabled={savingBulkLicense}
              className="rounded-md bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-70"
            >
              {savingBulkLicense ? "Running..." : "Run"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Make Payment"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded bg-gray-50 p-3 text-xs">
            <p className="font-semibold">{paymentAssessment?.entity?.name}</p>
            <p>{paymentAssessment?.incomeSource?.name} ({paymentAssessment?.assessmentPeriod})</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Amount (₦)</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Payer Name</label>
            <input
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Name on receipt"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Email Address (for Receipt)</label>
            <input
              type="email"
              value={payerEmail}
              onChange={(e) => setPayerEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="payer@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("remita")}
                className={`flex items-center justify-center space-x-2 rounded-md border p-3 text-xs font-medium transition-colors ${paymentMethod === "remita"
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-orange-600">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h1v6zm-1-8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" opacity="0" />
                  {/* Stylized R construction */}
                  <circle cx="12" cy="12" r="10" fill="#F4511E" />
                  <path d="M9 17V7h4c2.21 0 4 1.79 4 4 0 1.45-.78 2.73-1.94 3.43L17 17h-2.2l-1.6-2.4H11v2.4H9z m2-4.4h2c1.1 0 2-.9 2-2s-.9-2-2-2h-2v4z" fill="white" />
                </svg>
                <span className="text-sm">Remita</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("paystack")}
                className={`flex items-center justify-center space-x-2 rounded-md border p-3 text-xs font-medium transition-colors ${paymentMethod === "paystack"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <rect x="4" y="6" width="16" height="3" rx="1" fill="#0BA4DB" />
                  <rect x="4" y="10.5" width="16" height="3" rx="1" fill="#0BA4DB" />
                  <rect x="4" y="15" width="16" height="3" rx="1" fill="#0BA4DB" />
                </svg>
                <span className="text-sm">Paystack</span>
              </button>
            </div>
          </div>

          {/* Display RRR and Details after initialization */}
          {paymentData && paymentMethod === "remita" && (
            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-orange-100 p-4 rounded-lg border-2 border-orange-300 text-center shadow-sm relative overflow-hidden">
                <div className="text-[10px] text-orange-800 font-bold mb-1 uppercase tracking-wider">Payment Reference (RRR)</div>
                <div
                  className="font-mono text-2xl font-bold text-orange-700 tracking-[0.2em] bg-white/50 py-2 rounded border border-orange-200 cursor-pointer hover:bg-white transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(paymentData.rrr);
                    Swal.fire({
                      toast: true,
                      position: 'top-end',
                      icon: 'success',
                      title: 'RRR Copied!',
                      showConfirmButton: false,
                      timer: 1500
                    });
                  }}
                  title="Click to copy"
                >
                  {paymentData.rrr}
                </div>
                <div className="text-[9px] text-orange-600 mt-2 font-medium">Click to copy RRR</div>
              </div>

              <div className="rounded-md bg-orange-50 p-3 border border-orange-200">
                <div className="text-[11px] font-bold text-orange-800 mb-2 pb-1 border-b border-orange-100">Payment Summary</div>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-orange-600 font-bold uppercase tracking-tight">Narration</span>
                    <span className="text-[10px] text-gray-800 font-medium leading-relaxed">
                      {paymentData.remitaParams?.narration || 'Payment for Assessment'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] bg-white/30 p-1.5 rounded">
                    <span className="text-gray-600 font-medium">Amount:</span>
                    <span className="font-bold text-gray-900 text-sm">₦{Number(paymentData.remitaParams?.amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setPaymentData(null);
              }}
              className="rounded border border-gray-300 px-3 py-2 text-xs font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleInitiatePayment}
              disabled={processingPayment}
              className="w-full rounded bg-green-700 px-4 py-3 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-70 shadow-md transition-all active:scale-[0.98]"
            >
              {processingPayment ? (
                "Processing..."
              ) : (
                <>
                  Pay Now ₦{Number(paymentAmount || 0).toLocaleString()}
                  {paymentData?.rrr && <span className="block text-[10px] font-normal opacity-80 mt-0.5 tracking-wider">RRR: {paymentData.rrr}</span>}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div >
  );
}
