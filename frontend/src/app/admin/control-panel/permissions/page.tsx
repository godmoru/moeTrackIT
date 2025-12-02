"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface PermissionRow {
  id: number;
  name: string;
  code: string;
  module?: string | null;
  description?: string | null;
}

interface RoleRow {
  id: number;
  name: string;
  slug: string;
  permissions?: PermissionRow[];
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const modules = useMemo(
    () => Array.from(new Set(permissions.map((p) => p.module || "other"))).sort(),
    [permissions],
  );

  function updateSelectedFromRole(role: RoleRow | undefined) {
    if (!role || !role.permissions) {
      setSelectedPermissionIds(new Set());
      return;
    }
    setSelectedPermissionIds(new Set(role.permissions.map((p) => p.id)));
  }

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const [permRes, roleRes] = await Promise.all([
        fetch(`${API_BASE}/permissions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const permData = await permRes.json().catch(() => []);
      const roleData = await roleRes.json().catch(() => []);

      if (!permRes.ok) {
        throw new Error((permData && permData.message) || "Failed to load permissions");
      }
      if (!roleRes.ok) {
        throw new Error((roleData && roleData.message) || "Failed to load roles");
      }

      const perms = permData as PermissionRow[];
      const rls = roleData as RoleRow[];

      setPermissions(perms);
      setRoles(rls);

      // Initialise selection with first role if any
      if (rls.length > 0) {
        const firstRole = rls[0];
        setSelectedRoleId(firstRole.id);
        updateSelectedFromRole(firstRole);
      } else {
        setSelectedRoleId(null);
        setSelectedPermissionIds(new Set());
      }
    } catch (err: any) {
      setError(err.message || "Failed to load permissions / roles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTogglePermission(id: number) {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleRoleChange(roleIdStr: string) {
    const id = Number(roleIdStr || 0);
    if (!id) {
      setSelectedRoleId(null);
      setSelectedPermissionIds(new Set());
      return;
    }
    setSelectedRoleId(id);
    const role = roles.find((r) => r.id === id);
    updateSelectedFromRole(role);
  }

  async function handleSaveMapping() {
    if (!selectedRoleId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const permissionIds = Array.from(selectedPermissionIds);

      const res = await fetch(`${API_BASE}/roles/${selectedRoleId}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissionIds }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to update role permissions");
      }

      setSuccess("Permissions updated for selected role.");
    } catch (err: any) {
      setError(err.message || "Failed to update role permissions");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Permissions</h1>
        <p className="text-xs text-gray-500">
          Attach permissions to roles used in the admin portal.
        </p>
      </div>
      <div className="rounded-lg bg-white p-4 text-xs text-gray-700 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-[11px] font-medium text-gray-700">Role</label>
            <select
              value={selectedRoleId ?? ""}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="mt-1 w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            >
              {roles.length === 0 && <option value="">No roles available</option>}
              {roles.length > 0 && <option value="">Select a role</option>}
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role.slug})
                </option>
              ))}
            </select>
          </div>
          {loading && <span className="text-[11px] text-gray-500">Loading...</span>}
        </div>

        {(error || success) && (
          <div className="mt-3 space-y-1">
            {error && (
              <p className="text-[11px] text-red-600" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="text-[11px] text-green-700" role="status">
                {success}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Permissions
            </h2>
            {permissions.length === 0 ? (
              <p className="mt-2 text-[11px] text-gray-500">No permissions defined yet.</p>
            ) : !selectedRoleId ? (
              <p className="mt-2 text-[11px] text-gray-500">
                Select a role to view and edit its permissions.
              </p>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {modules.map((mod) => (
                  <div key={mod} className="border border-gray-200 rounded-md p-2">
                    <div className="mb-1 text-[11px] font-semibold text-gray-700">
                      {mod === "other" ? "Other" : mod}
                    </div>
                    <div className="space-y-1">
                      {permissions
                        .filter((p) => (p.module || "other") === mod)
                        .map((p) => (
                          <label key={p.id} className="flex items-center gap-2 text-[11px]">
                            <input
                              type="checkbox"
                              checked={selectedPermissionIds.has(p.id)}
                              onChange={() => handleTogglePermission(p.id)}
                              className="h-3 w-3 rounded border-gray-300 text-green-700 focus:ring-green-700"
                            />
                            <span>
                              <span className="font-medium text-gray-800">{p.name}</span>
                              <span className="ml-1 text-[10px] text-gray-500">({p.code})</span>
                            </span>
                          </label>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between gap-3">
            <p className="text-[11px] text-gray-500">
              Tick the permissions that should apply to the selected role, then click
              <span className="font-semibold"> Save mapping</span>. Enforcement is handled on the
              backend using this mapping.
            </p>
            <button
              type="button"
              onClick={handleSaveMapping}
              disabled={!selectedRoleId || saving}
              className="inline-flex items-center justify-center rounded-md bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save mapping"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
