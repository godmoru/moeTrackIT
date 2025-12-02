"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Modal } from "@/components/Modal";

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
}

interface IncomeSourceOption {
  id: number;
  name: string;
}

export default function AssessmentsPage() {
  const [items, setItems] = useState<Assessment[]>([]);
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSourceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIncomeSourceId, setActiveIncomeSourceId] = useState<number | "all">("all");
  const [activeYear, setActiveYear] = useState<string | "all">("all");

  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [savingNewAssessment, setSavingNewAssessment] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    entityId: "",
    incomeSourceId: "",
    assessmentPeriod: "",
    dueDate: "",
  });

  const [showBulkLicense, setShowBulkLicense] = useState(false);
  const [savingBulkLicense, setSavingBulkLicense] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    incomeSourceId: "",
    assessmentPeriod: "",
    dueDate: "",
    onlyActive: true,
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

      const [assessmentsRes, entitiesRes, incomeSourcesRes] = await Promise.all([
        fetch(`${API_BASE}/assessments`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
        fetch(`${API_BASE}/entities`, {
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
      ]);

      if (!assessmentsRes.ok || !entitiesRes.ok || !incomeSourcesRes.ok) {
        const body = await assessmentsRes.json().catch(() => ({}));
        throw new Error(body.message || "Failed to load data");
      }

      const assessmentsBody = await assessmentsRes.json();
      const entitiesBody = await entitiesRes.json();
      const incomeSourcesBody = await incomeSourcesRes.json();

      setItems(assessmentsBody);
      setEntities(entitiesBody);
      setIncomeSources(incomeSourcesBody);
    } catch (err: any) {
      setError(err.message || "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }

  function handleBulkAnnualLicense() {
    setBulkForm({
      incomeSourceId: "",
      assessmentPeriod: "",
      dueDate: "",
      onlyActive: true,
    });
    setShowBulkLicense(true);
  }

  async function submitBulkAnnualLicense() {
    if (!bulkForm.incomeSourceId || !bulkForm.assessmentPeriod) {
      await Swal.fire({
        icon: "error",
        title: "Missing fields",
        text: "Income Source and Assessment Year are required.",
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
      const res = await fetch(`${API_BASE}/assessments/bulk-annual-license`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          incomeSourceId,
          assessmentPeriod: bulkForm.assessmentPeriod,
          dueDate: bulkForm.dueDate || null,
          onlyActive: Boolean(bulkForm.onlyActive),
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
        text: err.message || "Failed to run bulk assessments",
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
    });
    setShowNewAssessment(true);
  }

  async function submitNewAssessment() {
    const { entityId, incomeSourceId, assessmentPeriod, dueDate } = newAssessment;

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
          parameterValues: {},
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
          <button
            onClick={handleBulkAnnualLicense}
            className="rounded-md border border-green-700 px-3 py-2 text-[11px] font-semibold text-green-700 hover:bg-green-50"
          >
            Mass Annual License
          </button>
          <button
            onClick={handleCreate}
            className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
          >
            New Assessment
          </button>
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
                className={`border-b-2 px-3 py-2 font-medium ${
                  isActive
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
            className={`rounded-full border px-2 py-1 ${
              activeYear === "all"
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
              className={`rounded-full border px-2 py-1 ${
                activeYear === y
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
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                        a.status === "paid"
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

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
              Assessment Year
            </label>
            <input
              value={newAssessment.assessmentPeriod}
              onChange={(e) =>
                setNewAssessment((prev) => ({
                  ...prev,
                  assessmentPeriod: e.target.value,
                }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="e.g. 2025"
            />
          </div>

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
      </div>
    </Modal>

    <Modal
      open={showBulkLicense}
      onClose={() => {
        if (!savingBulkLicense) setShowBulkLicense(false);
      }}
      title="Run Annual License Assessments"
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

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
              Assessment Year
            </label>
            <input
              value={bulkForm.assessmentPeriod}
              onChange={(e) =>
                setBulkForm((prev) => ({
                  ...prev,
                  assessmentPeriod: e.target.value,
                }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="e.g. 2025"
            />
          </div>

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

          <div className="flex items-center gap-2 md:col-span-2">
            <input
              id="bulk-only-active"
              type="checkbox"
              checked={bulkForm.onlyActive}
              onChange={(e) =>
                setBulkForm((prev) => ({
                  ...prev,
                  onlyActive: e.target.checked,
                }))
              }
              className="h-3 w-3"
            />
            <label
              htmlFor="bulk-only-active"
              className="text-[11px] text-gray-700"
            >
              Only active institutions
            </label>
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
            onClick={submitBulkAnnualLicense}
            disabled={savingBulkLicense}
            className="rounded-md bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-70"
          >
            {savingBulkLicense ? "Running..." : "Run"}
          </button>
        </div>
      </div>
    </Modal>
  </div>
);
}
