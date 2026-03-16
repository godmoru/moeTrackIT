"use client";

import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/ui/DataTable";
import * as XLSX from "xlsx";

interface Budget {
  id: string;
  reference: string;
  title: string;
  description: string;
  totalAmount: number;
  allocatedAmount: number;
  spentAmount: number;
  balance: number;
  fiscalYear: string;
  status: "draft" | "approved" | "active" | "completed" | "cancelled";
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

interface BudgetFormData {
  title: string;
  description: string;
  totalAmount: number;
  fiscalYear: string;
  startDate: string;
  endDate: string;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const { hasRole } = useAuth();
  const canManage = hasRole(["super_admin", "admin", "system_admin"]);
  const canApprove = hasRole(["super_admin", "admin", "system_admin"]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [saving, setSaving] = useState(false);

  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; errors: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form data
  const [formData, setFormData] = useState<BudgetFormData>({
    title: "",
    description: "",
    totalAmount: 0,
    fiscalYear: new Date().getFullYear().toString(),
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
  });

  useEffect(() => {
    loadBudgets();
  }, [searchTerm, statusFilter, yearFilter]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockBudgets: Budget[] = [
        {
          id: "1",
          reference: "BUD-2024-001",
          title: "Education Infrastructure Budget 2024",
          description: "Annual budget for school infrastructure development and maintenance",
          totalAmount: 50000000,
          allocatedAmount: 45000000,
          spentAmount: 32000000,
          balance: 13000000,
          fiscalYear: "2024",
          status: "active",
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-03-15T10:30:00Z",
        },
        {
          id: "2",
          reference: "BUD-2024-002",
          title: "Teacher Training Budget",
          description: "Budget for professional development and training programs",
          totalAmount: 15000000,
          allocatedAmount: 12000000,
          spentAmount: 8500000,
          balance: 3500000,
          fiscalYear: "2024",
          status: "active",
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          createdAt: "2024-01-15T00:00:00Z",
          updatedAt: "2024-03-10T14:20:00Z",
        },
      ];

      setBudgets(mockBudgets);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.description.trim() || formData.totalAmount <= 0) {
      Swal.fire("Error", "Please fill in all required fields", "error");
      return;
    }

    try {
      setSaving(true);
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowCreateModal(false);
      setFormData({
        title: "",
        description: "",
        totalAmount: 0,
        fiscalYear: new Date().getFullYear().toString(),
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
      });
      await loadBudgets();
      Swal.fire("Success", "Budget created successfully", "success");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to create budget", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedBudget || !formData.title.trim() || !formData.description.trim() || formData.totalAmount <= 0) {
      Swal.fire("Error", "Please fill in all required fields", "error");
      return;
    }

    try {
      setSaving(true);
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowEditModal(false);
      setSelectedBudget(null);
      setFormData({
        title: "",
        description: "",
        totalAmount: 0,
        fiscalYear: new Date().getFullYear().toString(),
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
      });
      await loadBudgets();
      Swal.fire("Success", "Budget updated successfully", "success");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to update budget", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (budget: Budget) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Are you sure you want to delete "${budget.title}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await loadBudgets();
      Swal.fire("Success", "Budget deleted successfully", "success");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to delete budget", "error");
    }
  };

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

        // Mock API call - replace with actual API
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1"}/budgets/bulk-import`, {
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
        Swal.fire("Success", "Import processed successfully!", "success");
        loadBudgets(); // Refresh list
      } catch (err: any) {
        console.error(err);
        Swal.fire("Error", err.message || "Failed to process import", "error");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        title: "Sample Budget Title",
        description: "Sample budget description",
        totalAmount: 50000000,
        fiscalYear: "2024",
        startDate: "2024-01-01",
        endDate: "2024-12-31"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Budgets");
    XLSX.writeFile(wb, "budgets_template.xlsx");
  };

  const handleApprove = async (budget: Budget) => {
    const result = await Swal.fire({
      title: "Approve Budget?",
      text: `Are you sure you want to approve "${budget.title}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, approve!",
    });

    if (!result.isConfirmed) return;

    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await loadBudgets();
      Swal.fire("Success", "Budget approved successfully", "success");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to approve budget", "error");
    }
  };

  const openEditModal = (budget: Budget) => {
    setSelectedBudget(budget);
    setFormData({
      title: budget.title,
      description: budget.description,
      totalAmount: budget.totalAmount,
      fiscalYear: budget.fiscalYear,
      startDate: budget.startDate,
      endDate: budget.endDate,
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      approved: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      completed: "bg-purple-100 text-purple-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getUsagePercentage = (spent: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((spent / total) * 100);
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
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Budgets</h1>
        {canManage && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="rounded-md border border-green-700 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
            >
              Import Bulk
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800 transition-colors"
            >
              + Create Budget
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Search:</span>
              <input
                type="text"
                placeholder="Search budgets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <span className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <span className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Year:</span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="all">All Years</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
          </div>

          {/* Budgets Table */}
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <DataTable
              data={budgets}
              columns={[
                {
                  header: "S/No",
                  cell: (_, index) => <span className="text-xs">{index + 1}</span>,
                },
                {
                  header: "Reference",
                  cell: (b) => <span className="text-xs font-medium">{b.reference}</span>,
                },
                {
                  header: "Title",
                  cell: (b) => <span className="text-xs max-w-xs truncate">{b.title}</span>,
                },
                {
                  header: "Total Amount",
                  cell: (b) => <span className="text-xs">₦{Number(b.totalAmount || 0).toLocaleString('en-NG')}</span>,
                },
                {
                  header: "Spent",
                  cell: (b) => <span className="text-xs">₦{Number(b.spentAmount || 0).toLocaleString('en-NG')}</span>,
                },
                {
                  header: "Balance",
                  cell: (b) => <span className="text-xs">₦{Number(b.balance || 0).toLocaleString('en-NG')}</span>,
                },
                {
                  header: "Usage",
                  cell: (b) => (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            getUsagePercentage(b.spentAmount, b.totalAmount) > 80 ? 'bg-red-500' :
                            getUsagePercentage(b.spentAmount, b.totalAmount) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(getUsagePercentage(b.spentAmount, b.totalAmount), 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs">{getUsagePercentage(b.spentAmount, b.totalAmount)}%</span>
                    </div>
                  ),
                },
                {
                  header: "Status",
                  cell: (b) => getStatusBadge(b.status),
                },
                {
                  header: <div className="text-right">Actions</div>,
                  cell: (b) => (
                    <div className="text-right flex justify-end gap-1 flex-wrap">
                      <button
                        onClick={() => {
                          setSelectedBudget(b);
                          setShowViewModal(true);
                        }}
                        className="rounded-md bg-green-50 px-2 py-1 text-[10px] font-medium text-green-800 hover:bg-green-100"
                      >
                        View
                      </button>
                      {canManage && b.status === 'draft' && (
                        <button
                          onClick={() => openEditModal(b)}
                          className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-800 hover:bg-blue-100"
                        >
                          Edit
                        </button>
                      )}
                      {canApprove && b.status === 'approved' && (
                        <button
                          onClick={() => handleApprove(b)}
                          className="rounded-md bg-green-50 px-2 py-1 text-[10px] font-medium text-green-800 hover:bg-green-100"
                        >
                          Activate
                        </button>
                      )}
                      {canManage && (b.status === 'draft' || b.status === 'cancelled') && (
                        <button
                          onClick={() => handleDelete(b)}
                          className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-medium text-red-800 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">Import Budgets</h2>
            <p className="mt-2 text-sm text-gray-600">
              Upload an Excel file to bulk create or update budgets.
            </p>
            
            <div className="mt-6 space-y-4">
              <div className="rounded-md bg-blue-50 p-3">
                <p className="text-xs text-blue-800 font-medium">Step 1: Download Template</p>
                <button
                  onClick={handleDownloadTemplate}
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

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({
            title: "",
            description: "",
            totalAmount: 0,
            fiscalYear: new Date().getFullYear().toString(),
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
          });
        }}
        title="Create Budget"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Enter budget title"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Enter budget description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Total Amount *
              </label>
              <input
                type="number"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                placeholder="Enter total amount"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fiscal Year *
              </label>
              <select
                value={formData.fiscalYear}
                onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => {
              setShowCreateModal(false);
              setFormData({
                title: "",
                description: "",
                totalAmount: 0,
                fiscalYear: new Date().getFullYear().toString(),
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
              });
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Budget"}
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBudget(null);
          setFormData({
            title: "",
            description: "",
            totalAmount: 0,
            fiscalYear: new Date().getFullYear().toString(),
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
          });
        }}
        title="Edit Budget"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Enter budget title"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Enter budget description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Total Amount *
              </label>
              <input
                type="number"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                placeholder="Enter total amount"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fiscal Year *
              </label>
              <select
                value={formData.fiscalYear}
                onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => {
              setShowEditModal(false);
              setSelectedBudget(null);
              setFormData({
                title: "",
                description: "",
                totalAmount: 0,
                fiscalYear: new Date().getFullYear().toString(),
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
              });
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleEdit}
            disabled={saving}
            className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {saving ? "Updating..." : "Update Budget"}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedBudget(null);
        }}
        title="Budget Details"
      >
        {selectedBudget && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-medium text-gray-500">Reference</h3>
                <p className="text-sm text-gray-900">{selectedBudget.reference}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500">Status</h3>
                <div className="mt-0.5">{getStatusBadge(selectedBudget.status)}</div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500">Title</h3>
              <p className="text-sm text-gray-900">{selectedBudget.title}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500">Description</h3>
              <p className="text-sm text-gray-900">{selectedBudget.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-medium text-gray-500">Total Amount</h3>
                <p className="text-sm text-gray-900">₦{Number(selectedBudget.totalAmount || 0).toLocaleString('en-NG')}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500">Fiscal Year</h3>
                <p className="text-sm text-gray-900">{selectedBudget.fiscalYear}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="text-xs font-medium text-gray-500">Allocated</h3>
                <p className="text-sm text-gray-900">₦{Number(selectedBudget.allocatedAmount || 0).toLocaleString('en-NG')}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500">Spent</h3>
                <p className="text-sm text-gray-900">₦{Number(selectedBudget.spentAmount || 0).toLocaleString('en-NG')}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500">Balance</h3>
                <p className="text-sm text-gray-900">₦{Number(selectedBudget.balance || 0).toLocaleString('en-NG')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-medium text-gray-500">Start Date</h3>
                <p className="text-sm text-gray-900">{new Date(selectedBudget.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500">End Date</h3>
                <p className="text-sm text-gray-900">{new Date(selectedBudget.endDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500">Usage Progress</h3>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Budget Usage</span>
                  <span>{getUsagePercentage(selectedBudget.spentAmount, selectedBudget.totalAmount)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      getUsagePercentage(selectedBudget.spentAmount, selectedBudget.totalAmount) > 80 ? 'bg-red-500' :
                      getUsagePercentage(selectedBudget.spentAmount, selectedBudget.totalAmount) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(getUsagePercentage(selectedBudget.spentAmount, selectedBudget.totalAmount), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
