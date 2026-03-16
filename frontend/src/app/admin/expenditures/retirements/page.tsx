"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { retirementsApi, expendituresApi } from "@/lib/api/expenditure.api";
import type { ExpenditureRetirement, Expenditure, RetirementFormData } from "@/types/expenditure.types";
import { DataTable } from "@/components/ui/DataTable";

export default function ExpenditureRetirementsPage() {
  const [retirements, setRetirements] = useState<ExpenditureRetirement[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { hasRole } = useAuth();
  const canManage = hasRole(["super_admin", "admin", "system_admin"]);
  const canApprove = hasRole(["super_admin", "admin", "system_admin"]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRetirement, setSelectedRetirement] = useState<ExpenditureRetirement | null>(null);
  const [saving, setSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState<RetirementFormData>({
    expenditureId: "",
    amountRetired: 0,
    purpose: "",
    remarks: "",
    retirementDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "all") params.status = statusFilter;

      const [retirementsResponse, expendituresResponse] = await Promise.all([
        retirementsApi.getAll(params),
        expendituresApi.getAll({ status: 'approved', limit: 1000 }),
      ]);

      setRetirements(retirementsResponse.data.items);
      setExpenditures(expendituresResponse.data.items);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.expenditureId || !formData.amountRetired || !formData.purpose.trim()) {
      Swal.fire("Error", "Please fill in all required fields", "error");
      return;
    }

    try {
      setSaving(true);
      await retirementsApi.create(formData);
      setShowCreateModal(false);
      setFormData({
        expenditureId: "",
        amountRetired: 0,
        purpose: "",
        remarks: "",
        retirementDate: new Date().toISOString().split('T')[0],
      });
      await loadData();
      Swal.fire("Success", "Retirement created successfully", "success");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to create retirement", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (retirement: ExpenditureRetirement) => {
    const result = await Swal.fire({
      title: "Submit for Review?",
      text: "Are you sure you want to submit this retirement for review?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, submit!",
    });

    if (!result.isConfirmed) return;

    try {
      await retirementsApi.submit(retirement.id);
      await loadData();
      Swal.fire("Success", "Retirement submitted for review", "success");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to submit retirement", "error");
    }
  };

  const handleApprove = async (retirement: ExpenditureRetirement) => {
    const result = await Swal.fire({
      title: "Approve Retirement?",
      text: "Are you sure you want to approve this retirement?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, approve!",
    });

    if (!result.isConfirmed) return;

    try {
      await retirementsApi.approve(retirement.id);
      await loadData();
      Swal.fire("Success", "Retirement approved successfully", "success");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to approve retirement", "error");
    }
  };

  const handleReject = async (retirement: ExpenditureRetirement) => {
    const { value: reason } = await Swal.fire({
      title: "Reject Retirement",
      input: "textarea",
      inputLabel: "Rejection Reason",
      inputPlaceholder: "Enter the reason for rejection...",
      inputAttributes: {
        "aria-label": "Enter the reason for rejection",
      },
      showCancelButton: true,
      confirmButtonText: "Reject",
      confirmButtonColor: "#d33",
    });

    if (!reason) return;

    try {
      await retirementsApi.reject(retirement.id, reason);
      await loadData();
      Swal.fire("Success", "Retirement rejected successfully", "success");
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to reject retirement", "error");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-yellow-100 text-yellow-800",
      under_review: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-purple-100 text-purple-800",
    };
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const getAvailableExpenditures = () => {
    return expenditures.filter(exp => {
      const hasRetirement = retirements.some(ret => ret.expenditureId === exp.id);
      return !hasRetirement;
    });
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
        <h1 className="text-lg font-semibold text-gray-900">Expenditure Retirements</h1>
        {canManage && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800 transition-colors"
          >
            + Create Retirement
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
                placeholder="Search retirements..."
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
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Retirements Table */}
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <DataTable
              data={retirements}
              columns={[
                {
                  header: "S/No",
                  cell: (_, index) => <span className="text-xs">{index + 1}</span>,
                },
                {
                  header: "Retirement No",
                  cell: (r) => <span className="text-xs font-medium">{r.retirementNumber}</span>,
                },
                {
                  header: "Expenditure Ref",
                  cell: (r) => <span className="text-xs">{r.expenditure?.referenceNumber || 'N/A'}</span>,
                },
                {
                  header: "Amount",
                  cell: (r) => <span className="text-xs">₦{Number(r.amountRetired || 0).toLocaleString('en-NG')}</span>,
                },
                {
                  header: "Purpose",
                  cell: (r) => <span className="text-xs max-w-xs truncate">{r.purpose}</span>,
                },
                {
                  header: "Status",
                  cell: (r) => getStatusBadge(r.status),
                },
                {
                  header: "Date",
                  cell: (r) => <span className="text-xs">{new Date(r.retirementDate).toLocaleDateString()}</span>,
                },
                {
                  header: <div className="text-right">Actions</div>,
                  cell: (r) => (
                    <div className="text-right flex justify-end gap-1 flex-wrap">
                      <button
                        onClick={() => {
                          setSelectedRetirement(r);
                          setShowViewModal(true);
                        }}
                        className="rounded-md bg-green-50 px-2 py-1 text-[10px] font-medium text-green-800 hover:bg-green-100"
                      >
                        View
                      </button>
                      {canManage && r.status === 'draft' && (
                        <button
                          onClick={() => handleSubmit(r)}
                          className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-800 hover:bg-blue-100"
                        >
                          Submit
                        </button>
                      )}
                      {canApprove && (r.status === 'under_review' || r.status === 'submitted') && (
                        <>
                          <button
                            onClick={() => handleApprove(r)}
                            className="rounded-md bg-green-50 px-2 py-1 text-[10px] font-medium text-green-800 hover:bg-green-100"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(r)}
                            className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-medium text-red-800 hover:bg-red-100"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  ),
                },
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
          setFormData({
            expenditureId: "",
            amountRetired: 0,
            purpose: "",
            remarks: "",
            retirementDate: new Date().toISOString().split('T')[0],
          });
        }}
        title="Create Expenditure Retirement"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Expenditure *
            </label>
            <select
              value={formData.expenditureId}
              onChange={(e) => {
                const expenditure = expenditures.find(exp => exp.id === e.target.value);
                setFormData({
                  ...formData,
                  expenditureId: e.target.value,
                  amountRetired: expenditure?.amount || 0,
                });
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            >
              <option value="">Select an expenditure</option>
              {getAvailableExpenditures().map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.referenceNumber} - ₦{Number(exp.amount || 0).toLocaleString('en-NG')} - {exp.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Amount to Retire *
            </label>
            <input
              type="number"
              value={formData.amountRetired}
              onChange={(e) => setFormData({ ...formData, amountRetired: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Enter amount"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Retirement Date *
            </label>
            <input
              type="date"
              value={formData.retirementDate}
              onChange={(e) => setFormData({ ...formData, retirementDate: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Purpose *
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Enter purpose of retirement"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={2}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Enter additional remarks (optional)"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => {
              setShowCreateModal(false);
              setFormData({
                expenditureId: "",
                amountRetired: 0,
                purpose: "",
                remarks: "",
                retirementDate: new Date().toISOString().split('T')[0],
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
            {saving ? "Creating..." : "Create Retirement"}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRetirement(null);
        }}
        title="Retirement Details"
      >
        {selectedRetirement && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-medium text-gray-500">Retirement Number</h3>
                <p className="text-sm text-gray-900">{selectedRetirement.retirementNumber}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500">Status</h3>
                <div className="mt-0.5">{getStatusBadge(selectedRetirement.status)}</div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500">Expenditure</h3>
              <p className="text-sm text-gray-900">{selectedRetirement.expenditure?.referenceNumber || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-medium text-gray-500">Amount Retired</h3>
                <p className="text-sm text-gray-900">₦{Number(selectedRetirement.amountRetired || 0).toLocaleString('en-NG')}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500">Balance Unretired</h3>
                <p className="text-sm text-gray-900">₦{Number(selectedRetirement.balanceUnretired || 0).toLocaleString('en-NG')}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500">Purpose</h3>
              <p className="text-sm text-gray-900">{selectedRetirement.purpose}</p>
            </div>
            {selectedRetirement.remarks && (
              <div>
                <h3 className="text-xs font-medium text-gray-500">Remarks</h3>
                <p className="text-sm text-gray-900">{selectedRetirement.remarks}</p>
              </div>
            )}
            <div>
              <h3 className="text-xs font-medium text-gray-500">Retirement Date</h3>
              <p className="text-sm text-gray-900">{new Date(selectedRetirement.retirementDate).toLocaleDateString()}</p>
            </div>
            {selectedRetirement.rejectionReason && (
              <div className="rounded-md bg-red-50 p-2">
                <h3 className="text-xs font-medium text-red-700">Rejection Reason</h3>
                <p className="text-sm text-red-600">{selectedRetirement.rejectionReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
