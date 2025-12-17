"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface AuditLog {
  id: number;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  method: string;
  path: string;
  statusCode: number | null;
  ipAddress: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  isp: string | null;
  userAgent: string | null;
  requestBody: string | null;
  responseMessage: string | null;
  details: string | null;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AuditStats {
  totalCount: number;
  actionCounts: { action: string; count: string }[];
  resourceCounts: { resource: string; count: string }[];
  activeUsers: { userId: number; userName: string; userEmail: string; count: string }[];
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  async function loadLogs() {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "50");
      if (search) params.append("search", search);
      if (actionFilter) params.append("action", actionFilter);
      if (resourceFilter) params.append("resource", resourceFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`${API_BASE}/audit-logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load audit logs");
      }

      setLogs(data.logs || []);
      setPagination(data.pagination || null);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) return;

      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`${API_BASE}/audit-logs/stats?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }

  useEffect(() => {
    loadLogs();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleSearch() {
    setPage(1);
    loadLogs();
    loadStats();
  }

  function handleReset() {
    setSearch("");
    setActionFilter("");
    setResourceFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    setTimeout(() => {
      loadLogs();
      loadStats();
    }, 0);
  }

  const actionColors: Record<string, string> = {
    CREATE: "bg-green-100 text-green-700",
    UPDATE: "bg-blue-100 text-blue-700",
    DELETE: "bg-red-100 text-red-700",
    LOGIN: "bg-purple-100 text-purple-700",
    LOGOUT: "bg-gray-100 text-gray-700",
    VIEW: "bg-gray-100 text-gray-600",
    BULK_ASSESSMENT: "bg-yellow-100 text-yellow-700",
    EXPORT: "bg-indigo-100 text-indigo-700",
    RESET_PASSWORD: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Audit Logs</h1>
        <p className="text-xs text-gray-500">
          View all system activities and user operations. Only accessible to Super Admins.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="text-[10px] font-medium uppercase text-gray-500">Total Events</div>
            <div className="mt-1 text-xl font-bold text-gray-900">
              {stats.totalCount.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="text-[10px] font-medium uppercase text-gray-500">Top Action</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">
              {stats.actionCounts[0]?.action || "-"}{" "}
              <span className="text-xs font-normal text-gray-500">
                ({stats.actionCounts[0]?.count || 0})
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="text-[10px] font-medium uppercase text-gray-500">Top Resource</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">
              {stats.resourceCounts[0]?.resource || "-"}{" "}
              <span className="text-xs font-normal text-gray-500">
                ({stats.resourceCounts[0]?.count || 0})
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="text-[10px] font-medium uppercase text-gray-500">Most Active User</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">
              {stats.activeUsers[0]?.userName || "-"}{" "}
              <span className="text-xs font-normal text-gray-500">
                ({stats.activeUsers[0]?.count || 0} actions)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Filters</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-6">
          <div>
            <label className="block text-[11px] font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="User, path, action..."
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-700">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            >
              <option value="">All</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="BULK_ASSESSMENT">Bulk Assessment</option>
              <option value="EXPORT">Export</option>
              <option value="RESET_PASSWORD">Reset Password</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-700">Resource</label>
            <input
              type="text"
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              placeholder="e.g. user, entity"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Logs Table */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Activity Log
          </h2>
          {loading && <span className="text-[11px] text-gray-500">Loading...</span>}
          {pagination && (
            <span className="text-[11px] text-gray-500">
              Showing {logs.length} of {pagination.total} events
            </span>
          )}
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Time</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">User</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Action</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Resource</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Path</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Status</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Location</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-[11px] text-gray-500">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-3 py-2 text-[11px] text-gray-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-[11px]">
                      <div className="font-medium text-gray-900">{log.userName || "System"}</div>
                      <div className="text-gray-500">{log.userEmail || "-"}</div>
                    </td>
                    <td className="px-3 py-2 text-[11px]">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          actionColors[log.action] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-gray-700">
                      {log.resource}
                      {log.resourceId && (
                        <span className="ml-1 text-gray-400">#{log.resourceId}</span>
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-[11px] text-gray-600">
                      <span className="font-mono">{log.method}</span> {log.path}
                    </td>
                    <td className="px-3 py-2 text-[11px]">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          log.statusCode && log.statusCode < 400
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {log.statusCode || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px]">
                      <div className="font-medium text-gray-700">
                        {log.city && log.country
                          ? `${log.city}, ${log.country}`
                          : log.country || log.ipAddress || "-"}
                      </div>
                      <div className="text-[10px] text-gray-400">{log.ipAddress}</div>
                    </td>
                    <td className="px-3 py-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="text-green-700 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-[11px] text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Audit Log Details</h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="font-medium text-gray-500">Timestamp</div>
                  <div className="text-gray-900">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">User</div>
                  <div className="text-gray-900">
                    {selectedLog.userName || "System"} ({selectedLog.userEmail || "-"})
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Role</div>
                  <div className="text-gray-900">{selectedLog.userRole || "-"}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Action</div>
                  <div className="text-gray-900">{selectedLog.action}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Resource</div>
                  <div className="text-gray-900">
                    {selectedLog.resource}
                    {selectedLog.resourceId && ` #${selectedLog.resourceId}`}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Status Code</div>
                  <div className="text-gray-900">{selectedLog.statusCode || "-"}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Method & Path</div>
                  <div className="font-mono text-gray-900">
                    {selectedLog.method} {selectedLog.path}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">IP Address</div>
                  <div className="text-gray-900">{selectedLog.ipAddress || "-"}</div>
                </div>
              </div>

              {/* Location Information */}
              {(selectedLog.country || selectedLog.city) && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <div className="mb-2 text-[11px] font-semibold uppercase text-gray-500">
                    Location Details
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <div>
                      <div className="text-[10px] font-medium text-gray-500">Country</div>
                      <div className="text-gray-900">{selectedLog.country || "-"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-gray-500">Region</div>
                      <div className="text-gray-900">{selectedLog.region || "-"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-gray-500">City</div>
                      <div className="text-gray-900">{selectedLog.city || "-"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-gray-500">Timezone</div>
                      <div className="text-gray-900">{selectedLog.timezone || "-"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-gray-500">ISP</div>
                      <div className="text-gray-900">{selectedLog.isp || "-"}</div>
                    </div>
                    {selectedLog.latitude && selectedLog.longitude && (
                      <div>
                        <div className="text-[10px] font-medium text-gray-500">Coordinates</div>
                        <div className="text-gray-900">
                          {selectedLog.latitude.toFixed(4)}, {selectedLog.longitude.toFixed(4)}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedLog.latitude && selectedLog.longitude && (
                    <div className="mt-2">
                      <a
                        href={`https://www.google.com/maps?q=${selectedLog.latitude},${selectedLog.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-green-700 hover:underline"
                      >
                        View on Google Maps →
                      </a>
                    </div>
                  )}
                </div>
              )}

              {selectedLog.requestBody && (
                <div>
                  <div className="font-medium text-gray-500">Request Body</div>
                  <pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-100 p-2 text-[10px] text-gray-800">
                    {JSON.stringify(JSON.parse(selectedLog.requestBody), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.responseMessage && (
                <div>
                  <div className="font-medium text-gray-500">Response Message</div>
                  <div className="text-gray-900">{selectedLog.responseMessage}</div>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <div className="font-medium text-gray-500">User Agent</div>
                  <div className="break-all text-gray-600">{selectedLog.userAgent}</div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-md bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
