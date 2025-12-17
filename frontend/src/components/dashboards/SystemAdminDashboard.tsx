"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface RoleCount {
  role: string;
  count: number;
}

interface SystemHealth {
  api: "online" | "offline" | "checking";
  database: "connected" | "disconnected" | "checking";
  auth: "active" | "inactive" | "checking";
  email: "configured" | "not_configured" | "checking";
}

export function SystemAdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalEntities: 0,
    totalLgas: 0,
    totalRoles: 0,
  });
  const [usersByRole, setUsersByRole] = useState<RoleCount[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    api: "checking",
    database: "checking",
    auth: "checking",
    email: "checking",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        // Load all data in parallel
        const [usersRes, entitiesRes, lgasRes, rolesRes] = await Promise.all([
          fetch(`${API_BASE}/users`, { headers }).catch(() => null),
          fetch(`${API_BASE}/institutions`, { headers }).catch(() => null),
          fetch(`${API_BASE}/lgas`, { headers }).catch(() => null),
          fetch(`${API_BASE}/roles`, { headers }).catch(() => null),
        ]);

        const users: User[] = usersRes?.ok ? await usersRes.json() : [];
        const entities = entitiesRes?.ok ? await entitiesRes.json() : [];
        const lgas = lgasRes?.ok ? await lgasRes.json() : [];
        const roles = rolesRes?.ok ? await rolesRes.json() : [];

        // Calculate stats
        const activeUsers = Array.isArray(users) 
          ? users.filter((u: User) => u.status === "active").length 
          : 0;

        setStats({
          totalUsers: Array.isArray(users) ? users.length : 0,
          activeUsers,
          totalEntities: Array.isArray(entities) ? entities.length : 0,
          totalLgas: Array.isArray(lgas) ? lgas.length : 0,
          totalRoles: Array.isArray(roles) ? roles.length : 0,
        });

        // Group users by role
        if (Array.isArray(users)) {
          const roleMap: Record<string, number> = {};
          users.forEach((u: User) => {
            const role = u.role || "unassigned";
            roleMap[role] = (roleMap[role] || 0) + 1;
          });
          const roleCounts = Object.entries(roleMap)
            .map(([role, count]) => ({ role, count }))
            .sort((a, b) => b.count - a.count);
          setUsersByRole(roleCounts);

          // Get recent users (last 5 created)
          const sorted = [...users].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setRecentUsers(sorted.slice(0, 5));
        }

        // Check system health
        setSystemHealth({
          api: usersRes?.ok ? "online" : "offline",
          database: usersRes?.ok || entitiesRes?.ok ? "connected" : "disconnected",
          auth: token ? "active" : "inactive",
          email: "not_configured", // Would need a dedicated endpoint to check
        });

      } catch (err: any) {
        setError(err.message || "Failed to load data");
        setSystemHealth({
          api: "offline",
          database: "disconnected",
          auth: "inactive",
          email: "not_configured",
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Format role name for display
  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">System Admin Dashboard</h1>
          <p className="text-sm text-gray-600">
            System configuration, users, and technical management.
          </p>
        </div>
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
          System Admin
        </span>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Link href="/admin/control-panel" className="rounded-lg bg-purple-50 p-3 hover:bg-purple-100 transition-colors">
          <div className="text-xs font-medium text-purple-800">Control Panel</div>
          <div className="text-[11px] text-purple-600">Full system access</div>
        </Link>
        <Link href="/admin/control-panel/users" className="rounded-lg bg-blue-50 p-3 hover:bg-blue-100 transition-colors">
          <div className="text-xs font-medium text-blue-800">User Management</div>
          <div className="text-[11px] text-blue-600">Manage all users</div>
        </Link>
        <Link href="/admin/control-panel/roles" className="rounded-lg bg-green-50 p-3 hover:bg-green-100 transition-colors">
          <div className="text-xs font-medium text-green-800">Roles & Permissions</div>
          <div className="text-[11px] text-green-600">Access control</div>
        </Link>
        <Link href="/admin/control-panel/settings" className="rounded-lg bg-orange-50 p-3 hover:bg-orange-100 transition-colors">
          <div className="text-xs font-medium text-orange-800">System Settings</div>
          <div className="text-[11px] text-orange-600">Configuration</div>
        </Link>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading stats...</p>}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          {/* System Stats */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">Total Users</div>
              <div className="mt-2 text-2xl font-semibold text-blue-700">{stats.totalUsers}</div>
              <div className="text-xs text-gray-500">{stats.activeUsers} active</div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">Institutions</div>
              <div className="mt-2 text-2xl font-semibold text-green-700">{stats.totalEntities}</div>
              <Link href="/admin/institutions" className="text-xs text-green-600 hover:underline">
                View all →
              </Link>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">LGAs</div>
              <div className="mt-2 text-2xl font-semibold text-purple-700">{stats.totalLgas}</div>
              <Link href="/admin/lgas" className="text-xs text-purple-600 hover:underline">
                View all →
              </Link>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">Roles</div>
              <div className="mt-2 text-2xl font-semibold text-orange-700">{stats.totalRoles}</div>
              <Link href="/admin/control-panel/roles" className="text-xs text-orange-600 hover:underline">
                Manage →
              </Link>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">System</div>
              <div className="mt-2 flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${systemHealth.api === "online" ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className={`text-lg font-semibold ${systemHealth.api === "online" ? "text-green-700" : "text-red-700"}`}>
                  {systemHealth.api === "online" ? "Healthy" : "Issues"}
                </span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="text-xs font-medium text-gray-500 uppercase mb-3">System Status</div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <div className={`flex items-center gap-2 rounded-md px-3 py-2 ${
                systemHealth.api === "online" ? "bg-green-50" : systemHealth.api === "checking" ? "bg-gray-50" : "bg-red-50"
              }`}>
                <div className={`h-2 w-2 rounded-full ${
                  systemHealth.api === "online" ? "bg-green-500" : systemHealth.api === "checking" ? "bg-gray-400 animate-pulse" : "bg-red-500"
                }`}></div>
                <span className="text-xs text-gray-700">API Server</span>
                <span className={`ml-auto text-xs font-medium ${
                  systemHealth.api === "online" ? "text-green-700" : systemHealth.api === "checking" ? "text-gray-500" : "text-red-700"
                }`}>
                  {systemHealth.api === "online" ? "Online" : systemHealth.api === "checking" ? "Checking..." : "Offline"}
                </span>
              </div>
              <div className={`flex items-center gap-2 rounded-md px-3 py-2 ${
                systemHealth.database === "connected" ? "bg-green-50" : systemHealth.database === "checking" ? "bg-gray-50" : "bg-red-50"
              }`}>
                <div className={`h-2 w-2 rounded-full ${
                  systemHealth.database === "connected" ? "bg-green-500" : systemHealth.database === "checking" ? "bg-gray-400 animate-pulse" : "bg-red-500"
                }`}></div>
                <span className="text-xs text-gray-700">Database</span>
                <span className={`ml-auto text-xs font-medium ${
                  systemHealth.database === "connected" ? "text-green-700" : systemHealth.database === "checking" ? "text-gray-500" : "text-red-700"
                }`}>
                  {systemHealth.database === "connected" ? "Connected" : systemHealth.database === "checking" ? "Checking..." : "Disconnected"}
                </span>
              </div>
              <div className={`flex items-center gap-2 rounded-md px-3 py-2 ${
                systemHealth.auth === "active" ? "bg-green-50" : systemHealth.auth === "checking" ? "bg-gray-50" : "bg-red-50"
              }`}>
                <div className={`h-2 w-2 rounded-full ${
                  systemHealth.auth === "active" ? "bg-green-500" : systemHealth.auth === "checking" ? "bg-gray-400 animate-pulse" : "bg-red-500"
                }`}></div>
                <span className="text-xs text-gray-700">Authentication</span>
                <span className={`ml-auto text-xs font-medium ${
                  systemHealth.auth === "active" ? "text-green-700" : systemHealth.auth === "checking" ? "text-gray-500" : "text-red-700"
                }`}>
                  {systemHealth.auth === "active" ? "Active" : systemHealth.auth === "checking" ? "Checking..." : "Inactive"}
                </span>
              </div>
              <div className={`flex items-center gap-2 rounded-md px-3 py-2 ${
                systemHealth.email === "configured" ? "bg-green-50" : "bg-yellow-50"
              }`}>
                <div className={`h-2 w-2 rounded-full ${
                  systemHealth.email === "configured" ? "bg-green-500" : "bg-yellow-500"
                }`}></div>
                <span className="text-xs text-gray-700">Email Service</span>
                <span className={`ml-auto text-xs font-medium ${
                  systemHealth.email === "configured" ? "text-green-700" : "text-yellow-700"
                }`}>
                  {systemHealth.email === "configured" ? "Configured" : "Check Config"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Users by Role */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-gray-500 uppercase">Users by Role</div>
                <Link href="/admin/control-panel/users" className="text-xs text-blue-600 hover:underline">
                  Manage users →
                </Link>
              </div>
              {usersByRole.length > 0 ? (
                <div className="space-y-2">
                  {usersByRole.map((item) => (
                    <div key={item.role} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-gray-700">{formatRole(item.role)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-blue-100 rounded-full" style={{ width: `${Math.min(item.count * 10, 100)}px` }}>
                          <div 
                            className="h-2 bg-blue-500 rounded-full" 
                            style={{ width: `${(item.count / stats.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No users found</p>
              )}
            </div>

            {/* Recent Users */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-gray-500 uppercase">Recently Added Users</div>
                <Link href="/admin/control-panel/users" className="text-xs text-blue-600 hover:underline">
                  View all →
                </Link>
              </div>
              {recentUsers.length > 0 ? (
                <div className="space-y-2">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                          {user.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800">
                          {formatRole(user.role || "unassigned")}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent users</p>
              )}
            </div>
          </div>

          {/* Admin Actions */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="text-xs font-medium text-gray-500 uppercase mb-3">Administrative Actions</div>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
              <Link
                href="/admin/control-panel/users"
                className="flex items-center gap-3 rounded-md border border-gray-200 px-4 py-3 hover:bg-gray-50"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-gray-800">Create User</div>
                  <div className="text-xs text-gray-500">Add new user</div>
                </div>
              </Link>
              <Link
                href="/admin/control-panel/roles"
                className="flex items-center gap-3 rounded-md border border-gray-200 px-4 py-3 hover:bg-gray-50"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-gray-800">Manage Roles</div>
                  <div className="text-xs text-gray-500">Permissions</div>
                </div>
              </Link>
              <Link
                href="/admin/control-panel"
                className="flex items-center gap-3 rounded-md border border-gray-200 px-4 py-3 hover:bg-gray-50"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-gray-800">System Settings</div>
                  <div className="text-xs text-gray-500">Configuration</div>
                </div>
              </Link>
              <Link
                href="/admin/reports"
                className="flex items-center gap-3 rounded-md border border-gray-200 px-4 py-3 hover:bg-gray-50"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-gray-800">System Reports</div>
                  <div className="text-xs text-gray-500">Analytics</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
