"use client";

import { FormEvent, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface RoleRow {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  isSystem?: boolean;
  permissions?: { id: number }[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadRoles() {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const res = await fetch(`${API_BASE}/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => []);

      if (!res.ok) {
        throw new Error((data && data.message) || "Failed to load roles");
      }

      setRoles(data as RoleRow[]);
    } catch (err: any) {
      setError(err.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
  }, []);

  async function handleCreateRole(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const res = await fetch(`${API_BASE}/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, slug, description }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to create role");
      }

      setName("");
      setSlug("");
      setDescription("");
      await loadRoles();
    } catch (err: any) {
      setError(err.message || "Failed to create role");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Roles</h1>
        <p className="text-xs text-gray-500">
          Manage high-level roles used for MOETrackIT administrators.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-4 text-xs text-gray-700 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Existing roles
            </h2>
            {loading && <span className="text-[11px] text-gray-500">Loading...</span>}
          </div>
          {error && (
            <p className="mt-2 text-[11px] text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Name</th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Slug</th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Description</th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Permissions</th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">System</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-[11px] text-gray-500">
                      No roles found.
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-[11px] text-gray-900">{role.name}</td>
                      <td className="px-3 py-2 text-[11px] text-gray-700">{role.slug}</td>
                      <td className="px-3 py-2 text-[11px] text-gray-700">
                        {role.description || "-"}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-gray-700">
                        {role.permissions ? role.permissions.length : 0}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-gray-700">
                        {role.isSystem ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 text-xs text-gray-700 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            New role
          </h2>
          <form onSubmit={handleCreateRole} className="mt-3 space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-700">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                placeholder="e.g. data_officer"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-md bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create role"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
