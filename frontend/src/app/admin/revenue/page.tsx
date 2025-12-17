"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { StatusBarChart } from "@/components/Charts";
import { Modal } from "@/components/Modal";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface StatusCount {
  status: string;
  count: string | number;
}

interface SummaryResponse {
  totalCollected: number;
  statusCounts: StatusCount[];
}

interface Entity {
  id: number;
  name: string;
  lga?: { name: string } | null;
}

interface IncomeSource {
  id: number;
  name: string;
  status: string;
}

interface Assessment {
  id: number;
  amountAssessed: number;
  status: string;
  entityId: number;
  IncomeSource?: { name: string };
}

export default function RevenuePage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [incomeSource, setIncomeSources] = useState<IncomeSource[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [savingCollection, setSavingCollection] = useState(false);
  const [newCollection, setNewCollection] = useState({
    entityId: "",
    assessmentId: "",
    amountPaid: "",
    paymentDate: "",
    method: "",
    reference: "",
  });

  async function loadSummary() {
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const res = await fetch(`${API_BASE}/reports/summary`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to load revenue summary");
      }
      const body = await res.json();
      setSummary(body);
    } catch (err: any) {
      setSummaryError(err.message || "Failed to load revenue summary");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function loadLookups() {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

      const [entitiesRes, assessmentsRes, incomeSourceRes] = await Promise.all([
        fetch(`${API_BASE}/institutions`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
        fetch(`${API_BASE}/assessments`, {
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

      if (!entitiesRes.ok || !assessmentsRes.ok || !incomeSourceRes.ok) {
        throw new Error("Failed to load entities or assessments");
      }

      const entitiesData = await entitiesRes.json();
      const assessmentsData = await assessmentsRes.json();
      const incomeSourceData = await incomeSourceRes.json();

      setEntities(entitiesData);
      setAssessments(assessmentsData);
      setIncomeSources(incomeSourceData);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadSummary();
    loadLookups();
  }, []);

  function handleNewCollection() {
    if (!entities.length) {
      Swal.fire({
        icon: "warning",
        title: "No institutions",
        text: "You must have institutions before recording collections.",
        confirmButtonColor: "#15803d",
      });
      return;
    }

    setNewCollection({
      entityId: "",
      assessmentId: "",
      amountPaid: "",
      paymentDate: "",
      method: "",
      reference: "",
    });
    setShowNewCollection(true);
  }

  async function submitNewCollection() {
    if (!newCollection.assessmentId || !newCollection.amountPaid) {
      await Swal.fire({
        icon: "error",
        title: "Missing fields",
        text: "Assessment and Amount Paid are required.",
        confirmButtonColor: "#b91c1c",
      });
      return;
    }

    const assessmentId = Number(newCollection.assessmentId);
    const amountPaid = Number(newCollection.amountPaid);

    if (Number.isNaN(assessmentId) || Number.isNaN(amountPaid)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid values",
        text: "IDs and amounts must be numbers.",
        confirmButtonColor: "#b91c1c",
      });
      return;
    }

    setSavingCollection(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const res = await fetch(`${API_BASE}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          assessmentId,
          amountPaid,
          paymentDate:
            newCollection.paymentDate || new Date().toISOString().slice(0, 10),
          method: newCollection.method || "bank_transfer",
          reference: newCollection.reference || null,
          status: "confirmed",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to record payment");
      }

      await Swal.fire({
        icon: "success",
        title: "Recorded",
        text: "Payment recorded successfully.",
        confirmButtonColor: "#15803d",
      });

      setShowNewCollection(false);
      await loadSummary();
      await loadLookups();
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to record payment",
        confirmButtonColor: "#b91c1c",
      });
    } finally {
      setSavingCollection(false);
    }
  }

  const totalCollected = summary?.totalCollected ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Revenue</h1>
        <button
          onClick={handleNewCollection}
          className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
        >
          New Collection
        </button>
      </div>

      {loadingSummary && (
        <p className="text-sm text-gray-600">Loading revenue...</p>
      )}
      {summaryError && (
        <p className="text-sm text-red-600" role="alert">
          {summaryError}
        </p>
      )}

      {!loadingSummary && !summaryError && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Collected (NGN)
              </div>
              <div className="mt-2 text-2xl font-semibold text-green-700">
                ₦{totalCollected.toLocaleString("en-NG", {
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm md:col-span-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Assessments by Status
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {summary?.statusCounts?.length ? (
                  summary.statusCounts.map((item) => (
                    <div
                      key={item.status}
                      className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-800"
                    >
                      <span className="font-medium capitalize">
                        {item.status}
                      </span>
                      <span className="text-gray-700">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">
                    No assessments have been recorded yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {summary?.statusCounts?.length ? (
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <StatusBarChart
                title="Assessments by Status (Chart)"
                data={summary.statusCounts}
              />
            </div>
          ) : null}
        </div>
      )}
      <Modal
        open={showNewCollection}
        onClose={() => {
          if (!savingCollection) setShowNewCollection(false);
        }}
        title="New Collection"
        size="lg"
      >
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Institution
              </label>
              <select
                value={newCollection.entityId}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewCollection((prev) => ({
                    ...prev,
                    entityId: value,
                    assessmentId: "",
                  }));
                }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="">-- Select Institution --</option>
                {entities.map((e) => {
                  const lgaLabel = e.lga?.name ? ` - ${e.lga.name}` : "";
                  return (
                    <option key={e.id} value={e.id}>
                      {e.name}
                      {lgaLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Assessment
              </label>
              <select
                value={newCollection.assessmentId}
                onChange={(e) =>
                  setNewCollection((prev) => ({
                    ...prev,
                    assessmentId: e.target.value,
                  }))
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="">-- Select Assessment --</option>
                {assessments
                  .filter((a) =>
                    newCollection.entityId
                      ? a.entityId === Number(newCollection.entityId)
                      : true,
                  )
                  .map((a) => {
                    const sourceName = a.IncomeSource?.name || "Assessment";
                    return (
                      <option key={a.id} value={a.id}>
                        {sourceName} - ₦{a.amountAssessed} ({a.status})
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Amount Paid (NGN)
              </label>
              <input
                value={newCollection.amountPaid}
                onChange={(e) =>
                  setNewCollection((prev) => ({
                    ...prev,
                    amountPaid: e.target.value,
                  }))
                }
                type="number"
                min={0}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                placeholder="Enter amount paid"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Payment Date
              </label>
              <input
                value={newCollection.paymentDate}
                onChange={(e) =>
                  setNewCollection((prev) => ({
                    ...prev,
                    paymentDate: e.target.value,
                  }))
                }
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Payment Method
              </label>
              <select
                value={newCollection.method}
                onChange={(e) =>
                  setNewCollection((prev) => ({
                    ...prev,
                    method: e.target.value,
                  }))
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="">-- Select Method --</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="pos">POS</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-medium text-gray-700">
                Reference / Purpose
              </label>
              <input
                value={newCollection.reference}
                onChange={(e) =>
                  setNewCollection((prev) => ({
                    ...prev,
                    reference: e.target.value,
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                placeholder="e.g. 2024 License Renewal (optional)"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                if (!savingCollection) setShowNewCollection(false);
              }}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitNewCollection}
              disabled={savingCollection}
              className="rounded-md bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-70"
            >
              {savingCollection ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// export default RevenuePage;