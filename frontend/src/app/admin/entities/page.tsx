"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/ui/DataTable";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface EntityType {
  name: string;
}

interface EntityOwnership {
  name: string;
}

interface LgaOption {
  id: number;
  name: string;
}

interface Entity {
  id: number;
  name: string;
  type: string;
  subType: string | null;
  ownership: string | null;
  state: string | null;
  lga: string | null;
  status: string;
  entityType?: EntityType;
  ownershipType?: EntityOwnership;
}

export default function EntitiesPage() {
  const [items, setItems] = useState<Entity[]>([]);
  const [lgas, setLgas] = useState<LgaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { hasRole } = useAuth();

  const canCreateAndExport = hasRole(['super_admin', 'system_admin', 'admin', 'area_education_officer']);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

      const [entitiesRes, lgasRes] = await Promise.all([
        fetch(`${API_BASE}/institutions`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
        fetch(`${API_BASE}/lgas`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
      ]);

      if (!entitiesRes.ok || !lgasRes.ok) {
        const body = await entitiesRes.json().catch(() => ({}));
        throw new Error(body.message || "Failed to load institutions or LGAs");
      }

      const entitiesBody = await entitiesRes.json();
      const lgasBody = await lgasRes.json();

      setItems(entitiesBody);
      setLgas(lgasBody);
    } catch (err: any) {
      setError(err.message || "Failed to load institutions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDownload(path: string, filename: string) {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const res = await fetch(`${API_BASE}${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to download export");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert((err as any).message || "Failed to download export");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Institutions</h1>
        <div className="flex flex-wrap items-center gap-3">
          {canCreateAndExport && (
            <>
              <div className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-700">
                <span className="font-semibold text-gray-600">Export:</span>
                <button
                  type="button"
                  onClick={() => handleDownload("/institutions/export.csv", "institutions.csv")}
                  className="rounded border border-transparent px-2 py-1 hover:bg-gray-50"
                >
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload("/institutions/export.xlsx", "institutions.xlsx")}
                  className="rounded border border-transparent px-2 py-1 hover:bg-gray-50"
                >
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload("/institutions/export.pdf", "institutions.pdf")}
                  className="rounded border border-transparent px-2 py-1 hover:bg-gray-50"
                >
                  PDF
                </button>
              </div>
              <Link
                href="/admin/institutions/new"
                className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
              >
                New Institution
              </Link>
            </>
          )}
        </div>
      </div>
      {loading && <p className="text-sm text-gray-600">Loading institutions...</p>}
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
              {
                header: "S/No",
                cell: (e, index) => <span className="text-xs">{index + 1}</span>,
              },
              {
                header: "Name",
                cell: (e) => (
                  <Link
                    href={`/admin/institutions/${e.id}`}
                    className="text-green-700 hover:underline font-medium text-xs"
                  >
                    {e.name}
                  </Link>
                ),
              },
              {
                header: "Type",
                cell: (e) => <span className="text-xs">{e.entityType?.name || e.subType || e.type}</span>,
              },
              {
                header: "Ownership",
                cell: (e) => <span className="text-xs">{e.ownershipType?.name || e.ownership || "-"}</span>,
              },
              {
                header: "State",
                cell: (e) => <span className="text-xs">{e.state || "-"}</span>,
              },
              {
                header: "LGA",
                cell: (e) => <span className="text-xs">{e.lga || "-"}</span>,
              },
              {
                header: "Status",
                cell: (e) => <span className="text-xs capitalize">{e.status}</span>,
              },
              {
                header: <div className="text-right">Actions</div>,
                cell: (e) => (
                  <div className="text-right">
                    <Link
                      href={`/admin/institutions/${e.id}`}
                      className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-100"
                    >
                      View
                    </Link>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
