"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { Modal } from "@/components/Modal";
import { DataTable } from "@/components/ui/DataTable";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface IncomeSource {
  id: number;
  name: string;
  code: string;
  category: string;
  recurrence: string;
  defaultAmount: string | number;
  active: boolean;
}

export default function IncomeSourcesPage() {
  const [items, setItems] = useState<IncomeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showNewSource, setShowNewSource] = useState(false);
  const [savingNewSource, setSavingNewSource] = useState(false);
  const [newSource, setNewSource] = useState({
    name: "",
    code: "",
    category: "one_time",
    recurrence: "none",
    defaultAmount: "",
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const res = await fetch(`${API_BASE}/income-sources`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to load income sources");
      }
      const body = await res.json();
      setItems(body);
    } catch (err: any) {
      setError(err.message || "Failed to load income sources");
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setNewSource({
      name: "",
      code: "",
      category: "one_time",
      recurrence: "none",
      defaultAmount: "",
    });
    setShowNewSource(true);
  }

  async function submitNewSource() {
    const { name, code, category, recurrence, defaultAmount } = newSource;

    if (!name || !code) {
      await Swal.fire({
        icon: "error",
        title: "Missing fields",
        text: "Name and code are required.",
        confirmButtonColor: "#b91c1c",
      });
      return;
    }

    const defaultAmountNum = defaultAmount ? Number(defaultAmount) : 0;
    if (Number.isNaN(defaultAmountNum)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid amount",
        text: "Default amount must be a number.",
        confirmButtonColor: "#b91c1c",
      });
      return;
    }

    setSavingNewSource(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const res = await fetch(`${API_BASE}/income-sources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          code,
          category,
          recurrence,
          defaultAmount: defaultAmountNum,
          active: true,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to create income source");
      }

      await Swal.fire({
        icon: "success",
        title: "Created",
        text: "Income source created successfully.",
        confirmButtonColor: "#15803d",
      });

      setShowNewSource(false);
      await load();
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to create income source",
        confirmButtonColor: "#b91c1c",
      });
    } finally {
      setSavingNewSource(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Income Sources</h1>
        <button
          onClick={handleCreate}
          className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
        >
          New Income Source
        </button>
      </div>
      {loading && <p className="text-sm text-gray-600">Loading income sources...</p>}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <DataTable
            data={items}
            columns={[
              { header: "S/No", cell: (s, index) => <span className="text-xs">{index + 1}</span> },
              {
                header: "Name",
                cell: (s) => (
                  <Link
                    href={`/admin/income-sources/${s.id}`}
                    className="text-green-700 hover:underline text-xs"
                  >
                    {s.name}
                  </Link>
                )
              },
              { header: "Code", cell: (s) => <span className="text-xs">{s.code}</span> },
              { header: "Category", cell: (s) => <span className="text-xs capitalize">{s.category}</span> },
              { header: "Recurrence", cell: (s) => <span className="text-xs capitalize">{s.recurrence}</span> },
              {
                header: "Default Amount (NGN)",
                cell: (s) => <span className="text-xs">N{Number(s.defaultAmount || 0).toLocaleString("en-NG")}</span>
              },
              { header: "Active", cell: (s) => <span className="text-xs">{s.active ? 'Yes' : 'No'}</span> },
            ]}
          />
        </div>
      )}
      <Modal
        open={showNewSource}
        onClose={() => {
          if (!savingNewSource) setShowNewSource(false);
        }}
        title="New Income Source"
        size="lg"
      >
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Name
              </label>
              <input
                value={newSource.name}
                onChange={(e) =>
                  setNewSource((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                placeholder="e.g. New School Registration"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Code
              </label>
              <input
                value={newSource.code}
                onChange={(e) =>
                  setNewSource((prev) => ({ ...prev, code: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                placeholder="Internal code"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Category
              </label>
              <select
                value={newSource.category}
                onChange={(e) =>
                  setNewSource((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="one_time">One-time</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Recurrence
              </label>
              <select
                value={newSource.recurrence}
                onChange={(e) =>
                  setNewSource((prev) => ({ ...prev, recurrence: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="none">None</option>
                <option value="yearly">Yearly</option>
                <option value="termly">Termly</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-medium text-gray-700">
                Default Amount (NGN)
              </label>
              <input
                value={newSource.defaultAmount}
                onChange={(e) =>
                  setNewSource((prev) => ({
                    ...prev,
                    defaultAmount: e.target.value,
                  }))
                }
                type="number"
                min={0}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                placeholder="Enter default amount"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                if (!savingNewSource) setShowNewSource(false);
              }}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitNewSource}
              disabled={savingNewSource}
              className="rounded-md bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-70"
            >
              {savingNewSource ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
