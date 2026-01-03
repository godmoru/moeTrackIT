"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Modal } from "@/components/Modal";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface Expenditure {
  id: number;
  referenceNumber: string;
  description: string;
  amount: number;
  status: string;
  date: string;
  category?: { name: string };
  approvedBy?: { name: string };
  createdBy?: { name: string };
}

interface CategoryOption {
  id: number;
  name: string;
}

export default function ExpendituresPage() {
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
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
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        
        const [expendituresRes, categoriesRes] = await Promise.all([
          fetch(`${API_BASE}/expenditures`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetch(`${API_BASE}/expenditure-categories`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
        ]);

        if (!expendituresRes.ok || !categoriesRes.ok) {
          throw new Error("Failed to load data");
        }

        const expendituresBody = await expendituresRes.json();
        const categoriesBody = await categoriesRes.json();

        setExpenditures(expendituresBody);
        setCategories(categoriesBody);
      } catch (err: any) {
        setError(err.message || "Failed to load expenditures");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredExpenditures = expenditures.filter((e) => {
    if (statusFilter !== "all" && (e.status || "") !== statusFilter) return false;
    if (categoryFilter !== "all" && (e.category?.name || "") !== categoryFilter) return false;
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
  const uniqueCategories = Array.from(
    new Set(expenditures.map((e) => (e.category?.name || "").trim()).filter(Boolean)),
  ).sort();

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
        <h1 className="text-lg font-semibold text-gray-900">Expenditures</h1>
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
            <div className="flex items-center gap-1">
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
            </div>
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
            <table className="min-w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 font-medium">S/No</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Reference</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium text-right">Amount (NGN)</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {expenditures.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No expenditures found. Create your first expenditure to get started.
                                </td>
                            </tr>
                        ) : (
                            expenditures.map((exp) => (
                                <tr key={exp.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {exp.referenceNumber}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="max-w-xs truncate">{exp.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₦{exp.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(exp.status)}`}>
                                            {exp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(exp.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link
                                            href={`/admin/expenditures/${exp.id}`}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
      )}
    </div>
  );
}
