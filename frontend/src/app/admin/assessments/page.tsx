"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

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
    assessmentPeriod: string;
    dueDate: string;
    parameterValues: Record<string, any>;
  }>({
    entityId: "",
    incomeSourceId: "",
    assessmentPeriod: "",
    dueDate: "",
    parameterValues: {},
  });

  const [showBulkLicense, setShowBulkLicense] = useState(false);
  const [savingBulkLicense, setSavingBulkLicense] = useState(false);
  const [bulkForm, setBulkForm] = useState<{
    incomeSourceId: string;
    assessmentPeriod: string;
    parameterValues: Record<string, any>;
    dueDate: string;
    onlyActive: boolean;
  }>({
    incomeSourceId: "",
    assessmentPeriod: "",
    parameterValues: {},
    dueDate: "",
    onlyActive: true,
  });
  const [bulkEntityTypeFilter, setBulkEntityTypeFilter] = useState<string>("");
  const [selectedEntityIds, setSelectedEntityIds] = useState<Set<number>>(new Set());
  const { hasRole } = useAuth();
  const canCreateAssessment = hasRole(['super_admin', 'admin', 'hq_cashier']);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAssessment, setPaymentAssessment] = useState<Assessment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerName, setPayerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "remita">("remita");
  const [processingPayment, setProcessingPayment] = useState(false);

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

      setItems(assessmentsBody);
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
          // assessmentPeriod: bulkForm.assessmentPeriod, // Now handled by backend/service
          parameterValues: bulkForm.parameterValues,
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
      assessmentPeriod: "",
      dueDate: "",
      parameterValues: {},
    });
    setShowNewAssessment(true);
  }



  async function submitNewAssessment() {
    const { entityId, incomeSourceId, assessmentPeriod, dueDate, parameterValues } = newAssessment;

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
          assessmentPeriod: assessmentPeriod || null,
          dueDate: dueDate || null,
          parameterValues: parameterValues,
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

      if (paymentMethod === "remita") {
        if (body.rrr) {
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
          throw new Error("No RRR returned");
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
            {canCreateAssessment && (
              <>
                <button
                  onClick={() => {
                    setBulkForm({
                      incomeSourceId: "",
                      assessmentPeriod: "",
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
            <table className="min-w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 font-medium">S/No</th>
                  <th className="px-3 py-2 font-medium">Institution</th>
                  <th className="px-3 py-2 font-medium">Income Source</th>
                  <th className="px-3 py-2 font-medium">Amount (NGN)</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Period</th>
                  <th className="px-3 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-2 text-xs text-gray-500"
                      colSpan={5}
                    >
                      No assessments match the selected filters.
                    </td>
                  </tr>
                )}
                {filteredItems.map((a, index) => (
                  <tr key={a.id} className="border-t text-gray-800">
                    <td className="px-3 py-2 text-xs">{++index}</td>
                    <td className="px-3 py-2 text-xs">{a.entity?.name || "-"}</td>
                    <td className="px-3 py-2 text-xs">
                      {a.incomeSource?.name || "-"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {Number(a.amountAssessed || 0).toLocaleString("en-NG")}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${a.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {a.status || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {a.assessmentPeriod || "-"}
                    </td>
                    <td className="px-3 py-2 text-xs text-right">
                      {a.status !== 'paid' && (
                        <button
                          onClick={() => openPaymentModal(a)}
                          className="rounded bg-green-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-green-700"
                        >
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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


            {/* Dynamic Parameters */}
            {(() => {
              const selectedSource = incomeSources.find(
                (s) => String(s.id) === newAssessment.incomeSourceId
              );
              if (!selectedSource || !selectedSource.parameters) return null;

              return selectedSource.parameters.map((param) => {
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

            {/* Dynamic Parameters for Mass Assessment */}
            {(() => {
              const selectedSource = incomeSources.find(
                (s) => String(s.id) === bulkForm.incomeSourceId
              );
              if (!selectedSource || !selectedSource.parameters) return null;

              return selectedSource.parameters.map((param) => {
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

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="rounded border border-gray-300 px-3 py-2 text-xs font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleInitiatePayment}
              disabled={processingPayment}
              className="rounded bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-70"
            >
              {processingPayment ? "Procesing..." : "Pay Now"}
            </button>
          </div>
        </div>
      </Modal>
    </div >
  );
}
