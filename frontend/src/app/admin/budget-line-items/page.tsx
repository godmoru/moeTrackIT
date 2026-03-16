"use client";

import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/ui/DataTable";
import * as XLSX from "xlsx";

interface BudgetLineItem {
  id: string;
  reference: string;
  budgetId: string;
  budgetReference: string;
  category: string;
  description: string;
  allocatedAmount: number;
  spentAmount: number;
  balance: number;
  status: "active" | "completed" | "suspended" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

interface BudgetLineItemFormData {
  budgetId: string;
  category: string;
  description: string;
  allocatedAmount: number;
}

export default function BudgetLineItemsPage() {
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [budgetFilter, setBudgetFilter] = useState<string>("all");

  const { hasRole } = useAuth();
  const canManage = hasRole(["super_admin", "admin", "system_admin"]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLineItem, setSelectedLineItem] = useState<BudgetLineItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; errors: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form data
  const [formData, setFormData] = useState<BudgetLineItemFormData>({
    budgetId: "",
    category: "",
    description: "",
    allocatedAmount: 0,
  });

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter, budgetFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Mock API calls - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockBudgets = [
        { id: "1", reference: "BUD-2024-001", title: "Education Infrastructure Budget 2024" },
        { id: "2", reference: "BUD-2024-002", title: "Teacher Training Budget" },
      ];

      const mockLineItems: BudgetLineItem[] = [
        {
          id: "1",
          reference: "BLI-2024-001",
          budgetId: "1",
          budgetReference: "BUD-2024-001",
          category: "Infrastructure",
          description: "School building construction and renovation",
          allocatedAmount: 30000000,
          spentAmount: 22000000,
          balance: 8000000,
          status: "active",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-03-15T10:30:00Z",
        },
        {
          id: "2",
          reference: "BLI-2024-002",
          budgetId: "1",
          budgetReference: "BUD-2024-001",
          category: "Equipment",
          description: "Purchase of classroom furniture and equipment",
          allocatedAmount: 15000000,
          spentAmount: 8000000,
          balance: 7000000,
          status: "active",
          createdAt: "2024-01-05T00:00:00Z",
          updatedAt: "2024-03-10T14:20:00Z",
        },
        {
          id: "3",
          reference: "BLI-2024-003",
          budgetId: "2",
          budgetReference: "BUD-2024-002",
          category: "Training",
          description: "Professional development programs for teachers",
          allocatedAmount: 10000000,
          spentAmount: 6500000,
          balance: 3500000,
          status: "active",
          createdAt: "2024-01-15T00:00:00Z",
          updatedAt: "2024-03-12T09:45:00Z",
        },
        {
          id: "4",
          reference: "BLI-2024-004",
          budgetId: "2",
          budgetReference: "BUD-2024-002",
          category: "Materials",
          description: "Training materials and resources",
          allocatedAmount: 5000000,
          spentAmount: 2000000,
          balance: 3000000,
          status: "active",
          createdAt: "2024-01-20T00:00:00Z",
          updatedAt: "2024-03-08T16:15:00Z",
        },
      ];

      setBudgets(mockBudgets);
      setLineItems(mockLineItems);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load budget line items");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.budgetId || !formData.category.trim() || !formData.description.trim() || formData.allocatedAmount <= 0) {
      Swal.fire("Error", "Please fill in all required fields", "error");
      return;
    }

    try {
      setSaving(true);
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowCreateModal(false);
      setFormData({
        budgetId: "",
        category: "",
        description: "",
        allocatedAmount: 0,
      });
      await loadData();
      Swal.fire("Success", "Budget line item created successfully", "success");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to create budget line item", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedLineItem || !formData.budgetId || !formData.category.trim() || !formData.description.trim() || formData.allocatedAmount <= 0) {
      Swal.fire("Error", "Please fill in all required fields", "error");
      return;
    }

    try {
      setSaving(true);
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowEditModal(false);
      setSelectedLineItem(null);
      setFormData({
        budgetId: "",
        category: "",
        description: "",
        allocatedAmount: 0,
      });
      await loadData();
      Swal.fire("Success", "Budget line item updated successfully", "success");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to update budget line item", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lineItem: BudgetLineItem) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Are you sure you want to delete "${lineItem.description}"? This action cannot be undone.`,
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
      
      await loadData();
      Swal.fire("Success", "Budget line item deleted successfully", "success");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to delete budget line item", "error");
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1"}/budget-line-items/bulk-import`, {
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
        loadData(); // Refresh list
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
        budgetReference: "BUD-2024-001",
        category: "Infrastructure",
        description: "Sample budget line item description",
        allocatedAmount: 5000000
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Budget Line Items");
    XLSX.writeFile(wb, "budget_line_items_template.xlsx");
  };

  const openEditModal = (lineItem: BudgetLineItem) => {
    setSelectedLineItem(lineItem);
    setFormData({
      budgetId: lineItem.budgetId,
      category: lineItem.category,
      description: lineItem.description,
      allocatedAmount: lineItem.allocatedAmount,
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      suspended: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getUsagePercentage = (spent: number, allocated: number) => {
    if (allocated === 0) return 0;
    return Math.round((spent / allocated) * 100);
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
        <h1 className="text-lg font-semibold text-gray-900">Budget Line Items</h1>
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
              + Create Line Item
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
                placeholder="Search line items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <span className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Budget:</span>
              <select
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="all">All Budgets</option>
                {budgets.map((budget) => (
                  <option key={budget.id} value={budget.id}>
                    {budget.reference}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <span className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Budget Line Items Table */}
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <DataTable
              data={lineItems}
              columns={[
                {
                  header: "S/No",
                  cell: (_, index) => <span className="text-xs">{index + 1}</span>,
                },
                {
                  header: "Reference",
                  cell: (item) => <span className="text-xs font-medium">{item.reference}</span>,
                },
                {
                  header: "Budget",
                  cell: (item) => <span className="text-xs">{item.budgetReference}</span>,
                },
                {
                  header: "Category",
                  cell: (item) => <span className="text-xs">{item.category}</span>,
                },
                {
                  header: "Description",
                  cell: (item) => <span className="text-xs max-w-xs truncate">{item.description}</span>,
                },
                {
                  header: "Allocated",
                  cell: (item) => <span className="text-xs">₦{Number(item.allocatedAmount || 0).toLocaleString('en-NG')}</span>,
                },
                {
                  header: "Spent",
                  cell: (item) => <span className="text-xs">₦{Number(item.spentAmount || 0).toLocaleString('en-NG')}</span>,
                },
                {
                  header: "Balance",
                  cell: (item) => <span className="text-xs">₦{Number(item.balance || 0).toLocaleString('en-NG')}</span>,
                },
                {
                  header: "Usage",
                  cell: (item) => (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            getUsagePercentage(item.spentAmount, item.allocatedAmount) > 80 ? 'bg-red-500' :
                            getUsagePercentage(item.spentAmount, item.allocatedAmount) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(getUsagePercentage(item.spentAmount, item.allocatedAmount), 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs">{getUsagePercentage(item.spentAmount, item.allocatedAmount)}%</span>
                    </div>
                  ),
                },
                {
                  header: "Status",
                  cell: (item) => getStatusBadge(item.status),
                },
                ...(canManage
                  ? [
                      {
                        header: <div className="text-right">Actions</div>,
                        cell: (item: BudgetLineItem) => (
                          <div className="text-right flex justify-end gap-1 flex-wrap">
                            <button
                              onClick={() => {
                                setSelectedLineItem(item);
                                setShowViewModal(true);
                              }}
                              className="rounded-md bg-green-50 px-2 py-1 text-[10px] font-medium text-green-800 hover:bg-green-100"
                            >
                              View
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-800 hover:bg-blue-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-medium text-red-800 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">Import Budget Line Items</h2>
            <p className="mt-2 text-sm text-gray-600">
              Upload an Excel file to bulk create or update budget line items.
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
            budgetId: "",
            category: "",
            description: "",
            allocatedAmount: 0,
          });
        }}
        title="Create Budget Line Item"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Budget *
            </label>
            <select
              value={formData.budgetId}
              onChange={(e) => setFormData({ ...formData, budgetId: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            >
              <option value="">Select a budget</option>
              {budgets.map((budget) => (
                <option key={budget.id} value={budget.id}>
                  {budget.reference} - {budget.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Category *
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Enter category"
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
              placeholder="Enter description"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Allocated Amount *
            </label>
            <input
              type="number"
              value={formData.allocatedAmount}
              onChange={(e) => setFormData({ ...formData, allocatedAmount: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Enter allocated amount"
              min="0"
              step="0.01"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => {
              setShowCreateModal(false);
              setFormData({
                budgetId: "",
                category: "",
                description: "",
                allocatedAmount: 0,
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
            {saving ? "Creating..." : "Create Line Item"}
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedLineItem(null);
          setFormData({
            budgetId: "",
            category: "",
            description: "",
            allocatedAmount: 0,
          });
        }}
        title="Edit Budget Line Item"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Budget *
            </label>
            <select
              value={formData.budgetId}
              onChange={(e) => setFormData({ ...formData, budgetId: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            >
              <option value="">Select a budget</option>
              {budgets.map((budget) => (
                <option key={budget.id} value={budget.id}>
                  {budget.reference} - {budget.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Category *
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Enter category"
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
              placeholder="Enter description"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Allocated Amount *
            </label>
            <input
              type="number"
              value={formData.allocatedAmount}
              onChange={(e) => setFormData({ ...formData, allocatedAmount: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Enter allocated amount"
              min="0"
              step="0.01"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => {
              setShowEditModal(false);
              setSelectedLineItem(null);
              setFormData({
                budgetId: "",
                category: "",
                description: "",
                allocatedAmount: 0,
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
            {saving ? "Updating..." : "Update Line Item"}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedLineItem(null);
        }}
        title="Budget Line Item Details"
      >
        {selectedLineItem && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-medium text-gray-500">Reference</h3>
                <p className="text-sm text-gray-900">{selectedLineItem.reference}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500">Status</h3>
                <div className="mt-0.5">{getStatusBadge(selectedLineItem.status)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-medium text-gray-500">Budget</h3>
                <p className="text-sm text-gray-900">{selectedLineItem.budgetReference}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500">Category</h3>
                <p className="text-sm text-gray-900">{selectedLineItem.category}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500">Description</h3>
              <p className="text-sm text-gray-900">{selectedLineItem.description}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="text-xs font-medium text-gray-500">Allocated</h3>
                <p className="text-sm text-gray-900">₦{Number(selectedLineItem.allocatedAmount || 0).toLocaleString('en-NG')}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500">Spent</h3>
                <p className="text-sm text-gray-900">₦{Number(selectedLineItem.spentAmount || 0).toLocaleString('en-NG')}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500">Balance</h3>
                <p className="text-sm text-gray-900">₦{Number(selectedLineItem.balance || 0).toLocaleString('en-NG')}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500">Usage Progress</h3>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Budget Usage</span>
                  <span>{getUsagePercentage(selectedLineItem.spentAmount, selectedLineItem.allocatedAmount)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      getUsagePercentage(selectedLineItem.spentAmount, selectedLineItem.allocatedAmount) > 80 ? 'bg-red-500' :
                      getUsagePercentage(selectedLineItem.spentAmount, selectedLineItem.allocatedAmount) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(getUsagePercentage(selectedLineItem.spentAmount, selectedLineItem.allocatedAmount), 100)}%` }}
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
