"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Modal } from "@/components/Modal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { expendituresApi, expenditureCategoriesApi } from "@/lib/api/expenditure.api";
import type { Expenditure, ExpenditureCategory } from "@/types/expenditure.types";
import { DataTable } from "@/components/ui/DataTable";

export default function ExpendituresPage() {
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [categories, setCategories] = useState<ExpenditureCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [showNewExpenditure, setShowNewExpenditure] = useState(false);
  const [savingNewExpenditure, setSavingNewExpenditure] = useState(false);
  const [newExpenditure, setNewExpenditure] = useState({
    description: "",
    amount: "",
    categoryId: "",
    date: "",
    referenceNumber: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expendituresResponse, categoriesResponse] = await Promise.all([
        expendituresApi.getAll(),
        expenditureCategoriesApi.getAll(),
      ]);

      setExpenditures(expendituresResponse.data.items);
      setCategories(categoriesResponse.data.items);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenditures = expenditures.filter((e) => {
    if (statusFilter !== "all" && (e.status || "") !== statusFilter) return false;
    // TODO: Re-enable once category is included in Expenditure type
    // if (categoryFilter !== "all" && (e.category?.name || "") !== categoryFilter) return false;
    if (fromDate) {
      const d = e.date ? new Date(e.date) : null;
      if (!d || d < new Date(fromDate)) return false;
    }
    if (toDate) {
      const d = e.date ? new Date(e.date) : null;
      if (!d || d > new Date(toDate)) return false;
    }
    return true;
  });

  const uniqueStatuses = Array.from(
    new Set(expenditures.map((e) => (e.status || "").trim()).filter(Boolean)),
  ).sort();
  // TODO: Re-enable once category is included in Expenditure type
  // const uniqueCategories = Array.from(
  //   new Set(expenditures.map((e) => (e.category?.name || "").trim()).filter(Boolean)),
  // ).sort();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-gray-900">Expenditures</h1>
          <Link
            href="/admin/expenditures/categories"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Manage Categories
          </Link>
          <Link
            href="/admin/expenditures/retirements"
            className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
          >
            Retirements
          </Link>
        </div>
        <Link
          href="/admin/expenditures/create"
          className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
        >
          + Create Expenditure
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="all">All</option>
                {uniqueStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {/* TODO: Re-enable once category is included in Expenditure type */}
            {/* <div className="flex items-center gap-1">
              <span className="text-gray-600">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="all">All</option>
                {uniqueCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div> */}
            <div className="flex items-center gap-1">
              <span className="text-gray-600">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-600">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <DataTable
              data={filteredExpenditures}
              columns={[
                { header: "S/No", cell: (e, index) => <span className="text-xs">{index + 1}</span> },
                {
                  header: "Date",
                  cell: (e) => <span className="text-xs">{e.date ? new Date(e.date).toLocaleDateString("en-NG") : "-"}</span>
                },
                { header: "Reference", cell: (e) => <span className="text-xs">{e.referenceNumber || "-"}</span> },
                { header: "Description", cell: (e) => <span className="text-xs">{e.description || "-"}</span> },
                { header: "Category", cell: (e) => <span className="text-xs">-</span> },
                {
                  header: <div className="text-right">Amount (NGN)</div>,
                  cell: (e) => <div className="text-right text-xs">₦{Number(e.amount || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}</div>
                },
                {
                  header: "Status",
                  cell: (e) => (
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${getStatusColor(e.status || '')
                        }`}
                    >
                      {e.status || "-"}
                    </span>
                  )
                },
                {
                  header: <div className="text-right">Action</div>,
                  cell: (e) => (
                    <div className="text-right">
                      <Link
                        href={`/admin/expenditures/${e.id}`}
                        className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View Details
                      </Link>
                    </div>
                  )
                }
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
