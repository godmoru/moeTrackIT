"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { expenditureCategoriesApi } from "@/lib/api/expenditure.api";
import type { ExpenditureCategory, ExpenditureCategoryFormData } from "@/types/expenditure.types";
import { DataTable } from "@/components/ui/DataTable";

export default function ExpenditureCategoriesPage() {
  const [categories, setCategories] = useState<ExpenditureCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { hasRole } = useAuth();
  const canManage = hasRole(["super_admin", "admin", "system_admin"]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenditureCategory | null>(null);
  const [saving, setSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState<ExpenditureCategoryFormData>({
    cat_name: "",
    description: "",
  });

  useEffect(() => {
    loadCategories();
  }, [searchTerm, statusFilter]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await expenditureCategoriesApi.getAll(params);
      setCategories(response.data.items);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.cat_name.trim() || !formData.description.trim()) {
      Swal.fire("Error", "Please fill in all required fields", "error");
      return;
    }

    try {
      setSaving(true);
      await expenditureCategoriesApi.create(formData);
      setShowCreateModal(false);
      setFormData({ cat_name: "", description: "" });
      await loadCategories();
      Swal.fire("Success", "Category created successfully", "success");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to create category", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory || !formData.cat_name.trim() || !formData.description.trim()) {
      Swal.fire("Error", "Please fill in all required fields", "error");
      return;
    }

    try {
      setSaving(true);
      await expenditureCategoriesApi.update(selectedCategory.id, formData);
      setShowEditModal(false);
      setSelectedCategory(null);
      setFormData({ cat_name: "", description: "" });
      await loadCategories();
      Swal.fire("Success", "Category updated successfully", "success");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to update category", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: ExpenditureCategory) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Are you sure you want to delete "${category.cat_name}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await expenditureCategoriesApi.delete(category.id);
      await loadCategories();
      Swal.fire("Success", "Category deleted successfully", "success");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to delete category", "error");
    }
  };

  const openEditModal = (category: ExpenditureCategory) => {
    setSelectedCategory(category);
    setFormData({
      cat_name: category.cat_name,
      description: category.description,
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      suspended: "bg-red-100 text-red-800",
    };
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
        <h1 className="text-lg font-semibold text-gray-900">Expenditure Categories</h1>
        {canManage && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800 transition-colors"
          >
            + Create Category
          </button>
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
                placeholder="Search categories..."
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
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Categories Table */}
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <DataTable
              data={categories}
              columns={[
                {
                  header: "S/No",
                  cell: (_, index) => <span className="text-xs">{index + 1}</span>,
                },
                {
                  header: "Reference",
                  cell: (c) => <span className="text-xs font-medium">{c.reference}</span>,
                },
                {
                  header: "Name",
                  cell: (c) => <span className="text-xs">{c.cat_name}</span>,
                },
                {
                  header: "Description",
                  cell: (c) => <span className="text-xs max-w-xs truncate">{c.description}</span>,
                },
                {
                  header: "Status",
                  cell: (c) => getStatusBadge(c.status),
                },
                {
                  header: "Created",
                  cell: (c) => <span className="text-xs">{new Date(c.createdAt).toLocaleDateString()}</span>,
                },
                ...(canManage
                  ? [
                      {
                        header: <div className="text-right">Actions</div>,
                        cell: (c: ExpenditureCategory) => (
                          <div className="text-right space-x-1">
                            <button
                              onClick={() => openEditModal(c)}
                              className="rounded-md bg-green-50 px-2 py-1 text-[10px] font-medium text-green-800 hover:bg-green-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(c)}
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

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ cat_name: "", description: "" });
        }}
        title="Create Expenditure Category"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.cat_name}
              onChange={(e) => setFormData({ ...formData, cat_name: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Enter category name"
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
              placeholder="Enter category description"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => {
              setShowCreateModal(false);
              setFormData({ cat_name: "", description: "" });
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
            {saving ? "Creating..." : "Create Category"}
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategory(null);
          setFormData({ cat_name: "", description: "" });
        }}
        title="Edit Expenditure Category"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.cat_name}
              onChange={(e) => setFormData({ ...formData, cat_name: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Enter category name"
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
              placeholder="Enter category description"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => {
              setShowEditModal(false);
              setSelectedCategory(null);
              setFormData({ cat_name: "", description: "" });
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
            {saving ? "Updating..." : "Update Category"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
