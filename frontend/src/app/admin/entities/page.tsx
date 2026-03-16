"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/ui/DataTable";
import * as XLSX from "xlsx";
import { toast } from "sonner";

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
  studentPopulation?: number;
}

export default function EntitiesPage() {
  const [items, setItems] = useState<Entity[]>([]);
  const [lgas, setLgas] = useState<LgaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; errors: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      toast.error((err as any).message || "Failed to download export");
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.error("The file is empty or formatted incorrectly.");
          setImporting(false);
          return;
        }

        const token = localStorage.getItem("authToken");
        const res = await fetch(`${API_BASE}/institutions/bulk-import`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rows: data }),
        });

        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.message || "Import failed");
        }

        setImportResult(result);
        toast.success("Import processed successfully!");
        load(); // Refresh the list
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to process import");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

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
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="rounded-md border border-green-700 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
              >
                Import Bulk
              </button>
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

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">Import Institutions</h2>
            <p className="mt-2 text-sm text-gray-600">
              Upload an Excel file to bulk create or update institutions.
            </p>
            
            <div className="mt-6 space-y-4">
              <div className="rounded-md bg-blue-50 p-3">
                <p className="text-xs text-blue-800 font-medium">Step 1: Download Template</p>
                <button
                  onClick={() => handleDownload("/institutions/export-template", "institutions_template.xlsx")}
                  className="mt-2 text-xs text-blue-600 underline hover:text-blue-800"
                >
                  Download Import Template (Excel)
                </button>
              </div>

              <div className="rounded-md border-2 border-dashed border-gray-300 p-6 text-center">
                <p className="text-xs text-gray-600">Step 2: Upload Completed File</p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleImport}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="mt-4 rounded-md bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                >
                  {importing ? "Processing..." : "Select File & Import"}
                </button>
              </div>

              {importResult && (
                <div className="rounded-md bg-gray-100 p-3 text-xs">
                  <p className="font-bold text-gray-900">Import Result:</p>
                  <p className="text-green-700">Created: {importResult.created}</p>
                  <p className="text-blue-700">Updated: {importResult.updated}</p>
                  {importResult.errors.length > 0 && (
                    <p className="text-red-600 mt-1">Errors: {importResult.errors.length} rows (check console for details)</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportResult(null);
                }}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                header: "Population",
                cell: (e) => <span className="text-xs text-center">{e.studentPopulation || "-"}</span>,
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
