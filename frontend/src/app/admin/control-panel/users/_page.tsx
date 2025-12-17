"use client";

import { FormEvent, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
}

interface CreatedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface RoleOption {
  id: number;
  name: string;
  slug: string;
}

export default function UsersPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("officer");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [usersError, setUsersError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [resettingUserId, setResettingUserId] = useState<number | null>(null);

  const [editRole, setEditRole] = useState<Record<number, string>>({});
  const [editStatus, setEditStatus] = useState<Record<number, string>>({});

  const [roles, setRoles] = useState<RoleOption[]>([]);

  async function loadUsers() {
    try {
      setUsersLoading(true);
      setUsersError(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const params = new URLSearchParams();
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (search) params.append("search", search);

      const url = `${API_BASE}/users${params.toString() ? `?${params.toString()}` : ""}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => []);

      if (!res.ok) {
        throw new Error((data && data.message) || "Failed to load users");
      }

      setUsers(data as UserRow[]);
      const roleMap: Record<number, string> = {};
      const statusMap: Record<number, string> = {};
      (data as UserRow[]).forEach((u) => {
        roleMap[u.id] = u.role;
        statusMap[u.id] = u.status;
      });
      setEditRole(roleMap);
      setEditStatus(statusMap);
    } catch (err: any) {
      setUsersError(err.message || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadRoles() {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) return;

      const res = await fetch(`${API_BASE}/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => []);
      if (res.ok && Array.isArray(data)) {
        setRoles(data as RoleOption[]);
        // Set default role to first available role if current default doesn't exist
        if (data.length > 0 && !data.some((r: RoleOption) => r.slug === role)) {
          setRole(data[0].slug);
        }
      }
    } catch (err) {
      console.error("Failed to load roles:", err);
    }
  }

  useEffect(() => {
    loadUsers();
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpdateUser(user: UserRow) {
    try {
      const originalRole = user.role;
      const originalStatus = user.status;
      const newRole = editRole[user.id] || user.role;
      const newStatus = editStatus[user.id] || user.status;

      // Build role rank dynamically from fetched roles (higher index = higher rank)
      const roleRank: Record<string, number> = {};
      roles.forEach((r, index) => {
        roleRank[r.slug] = roles.length - index; // First role gets highest rank
      });

      const isDowngrade =
        roleRank[originalRole] !== undefined &&
        roleRank[newRole] !== undefined &&
        roleRank[newRole] < roleRank[originalRole];
      const isDisabling = originalStatus === "active" && newStatus === "disabled";

      if (isDowngrade || isDisabling) {
        const messageParts = [] as string[];
        if (isDowngrade) {
          messageParts.push(
            `You are changing role from ${originalRole} to ${newRole}. This may remove access to some features.`,
          );
        }
        if (isDisabling) {
          messageParts.push(
            "You are disabling this user. They will no longer be able to log in while disabled.",
          );
        }
        const confirmed = window.confirm(
          `${messageParts.join("\n\n")}\n\nDo you want to continue?`,
        );
        if (!confirmed) {
          return;
        }
      }

      setUpdatingUserId(user.id);
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const res = await fetch(`${API_BASE}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: newRole,
          status: newStatus,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to update user");
      }

      // Refresh users to reflect latest data
      await loadUsers();
    } catch (err: any) {
      setUsersError(err.message || "Failed to update user");
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleResetPassword(user: UserRow) {
    try {
      const newPassword = window.prompt(
        `Enter a new password for ${user.email}.\nThis will immediately replace their old password.`,
      );
      if (!newPassword) {
        return;
      }

      setResettingUserId(user.id);
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: user.email, password: newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setUsersError(null);
      setSuccess(`Password reset successfully for ${user.email}`);
    } catch (err: any) {
      setUsersError(err.message || "Failed to reset password");
    } finally {
      setResettingUserId(null);
    }
  }

  async function handleCreateUser(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setCreatedUser(null);
    setLoading(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password, role, status }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to create user");
      }

      setCreatedUser(data as CreatedUser);
      setSuccess("User created successfully");
      setName("");
      setEmail("");
      setPassword("");
      setRole("officer");
      setStatus("active");

      // Refresh list after successful creation
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Admin Users</h1>
        <p className="text-xs text-gray-500">
          Create new admin users for MOETrackIT and assign them a role.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow-sm md:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            New user
          </h2>
          <form onSubmit={handleCreateUser} className="mt-3 space-y-3 text-xs">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-700">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-700">Temporary password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.slug}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

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

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded-md bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-60"
            >
              {loading ? "Creating user..." : "Create user"}
            </button>
          </form>
        </div>

        <div className="space-y-3 text-xs">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Filters
            </h2>
            <div className="mt-3 space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-700">Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700">Role</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                  >
                    <option value="">All</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.slug}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                  >
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={loadUsers}
                  className="inline-flex items-center rounded-md bg-green-700 px-3 py-1 text-[11px] font-semibold text-white hover:bg-green-800"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoleFilter("");
                    setStatusFilter("");
                    setSearch("");
                    loadUsers();
                  }}
                  className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
              {usersError && (
                <p className="text-[11px] text-red-600" role="alert">
                  {usersError}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 text-xs text-gray-700 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Recently created
            </h2>
            {createdUser ? (
              <div className="mt-3 space-y-1">
                <div className="font-medium text-gray-900">{createdUser.name}</div>
                <div className="text-[11px] text-gray-600">{createdUser.email}</div>
                <div className="text-[11px] text-gray-600">
                  Role: <span className="font-medium">{createdUser.role}</span>
                </div>
                <div className="text-[11px] text-gray-600">
                  Status: <span className="font-medium">{createdUser.status}</span>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-[11px] text-gray-500">
                After you create a user, a summary will appear here.
              </p>
            )}
            <p className="mt-4 text-[11px] text-gray-500">
              Only <span className="font-medium">super_admin</span> users can create other
              users. Use this section to onboard MOETrackIT officers and admins.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 text-xs text-gray-700 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Users
          </h2>
          {usersLoading && (
            <span className="text-[11px] text-gray-500">Loading...</span>
          )}
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Name</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Email</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Role</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Status</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Created</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-[11px] text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-[11px] text-gray-900">{u.name}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-700">{u.email}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-700">
                      <select
                        value={editRole[u.id] ?? u.role}
                        onChange={(e) =>
                          setEditRole((prev) => ({ ...prev, [u.id]: e.target.value }))
                        }
                        className="w-full rounded-md border border-gray-200 px-2 py-1 text-[11px] focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.slug}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-gray-700">
                      <select
                        value={editStatus[u.id] ?? u.status}
                        onChange={(e) =>
                          setEditStatus((prev) => ({ ...prev, [u.id]: e.target.value }))
                        }
                        className="w-full rounded-md border border-gray-200 px-2 py-1 text-[11px] focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
                      >
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-gray-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleString() : ""}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-gray-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateUser(u)}
                          disabled={updatingUserId === u.id}
                          className="inline-flex items-center rounded-md border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                          {updatingUserId === u.id ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetPassword(u)}
                          disabled={resettingUserId === u.id}
                          className="inline-flex items-center rounded-md border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          {resettingUserId === u.id ? "Resetting..." : "Reset password"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
