"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface IncomeSource {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  category: string;
  recurrence: string;
  defaultAmount: string | number;
  active: boolean;
}

export default function IncomeSourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useAuth();
  const id = params?.id as string | undefined;

  const [source, setSource] = useState<IncomeSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("one_time");
  const [recurrence, setRecurrence] = useState("none");
  const [defaultAmount, setDefaultAmount] = useState("");
  const [active, setActive] = useState(true);

  const canEdit = hasRole(['super_admin', 'system_admin']);

  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

        const res = await fetch(`${API_BASE}/income-sources/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load income source");
        }

        const data: IncomeSource = await res.json();
        setSource(data);

        // Populate form fields
        setName(data.name || "");
        setCode(data.code || "");
        setDescription(data.description || "");
        setCategory(data.category || "one_time");
        setRecurrence(data.recurrence || "none");
        setDefaultAmount(data.defaultAmount?.toString() || "");
        setActive(data.active ?? true);
      } catch (err: any) {
        setError(err.message || "Failed to load income source");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function handleSave() {
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

    setSaving(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

      const res = await fetch(`${API_BASE}/income-sources/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          code,
          description: description || null,
          category,
          recurrence,
          defaultAmount: defaultAmountNum,
          active,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to update income source");
      }

      const updated: IncomeSource = await res.json();
      setSource(updated);
      setIsEditing(false);

      await Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Income source updated successfully.",
        confirmButtonColor: "#15803d",
      });
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to update income source",
        confirmButtonColor: "#b91c1c",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (!source) return;

    // Reset form to original values
    setName(source.name || "");
    setCode(source.code || "");
    setDescription(source.description || "");
    setCategory(source.category || "one_time");
    setRecurrence(source.recurrence || "none");
    setDefaultAmount(source.defaultAmount?.toString() || "");
    setActive(source.active ?? true);
    setIsEditing(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Loading income source...</p>
      </div>
    );
  }

  if (error || !source) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">{error || "Income source not found"}</p>
        <Link
          href="/admin/income-sources"
          className="inline-block rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
        >
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">
          {isEditing ? "Edit Income Source" : source.name}
        </h1>
        <div className="flex items-center gap-2">
          {!isEditing && canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Edit
            </button>
          )}
          <Link
            href="/admin/income-sources"
            className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Back to list
          </Link>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        {!isEditing ? (
          <dl className="grid gap-4 text-xs md:grid-cols-2">
            <div>
              <dt className="font-medium text-gray-700">Name</dt>
              <dd className="mt-1 text-gray-900">{source.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Code</dt>
              <dd className="mt-1 text-gray-900">{source.code}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Category</dt>
              <dd className="mt-1 capitalize text-gray-900">{source.category}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Recurrence</dt>
              <dd className="mt-1 capitalize text-gray-900">{source.recurrence}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Default Amount (NGN)</dt>
              <dd className="mt-1 text-gray-900">
                ₦{Number(source.defaultAmount || 0).toLocaleString("en-NG")}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${source.active
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                    }`}
                >
                  {source.active ? "Active" : "Inactive"}
                </span>
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-medium text-gray-700">Description</dt>
              <dd className="mt-1 text-gray-900">
                {source.description || "No description provided."}
              </dd>
            </div>
          </dl>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  placeholder="e.g. New School Registration"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  placeholder="Internal code"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                >
                  <option value="none">None</option>
                  <option value="yearly">Yearly</option>
                  <option value="termly">Termly</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Default Amount (NGN)
                </label>
                <input
                  value={defaultAmount}
                  onChange={(e) => setDefaultAmount(e.target.value)}
                  type="number"
                  min={0}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  placeholder="Enter default amount"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={active ? "active" : "inactive"}
                  onChange={(e) => setActive(e.target.value === "active")}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-xs font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="rounded-md border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-70"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
