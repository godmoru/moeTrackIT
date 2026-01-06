"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Modal } from "@/components/Modal";
import { retirementsApi, expendituresApi } from "@/lib/api/expenditure.api";
import type { ExpenditureRetirement, Expenditure, RetirementFormData } from "@/types/expenditure.types";

export default function ExpenditureRetirementsPage() {
  const [retirements, setRetirements] = useState<ExpenditureRetirement[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
        expendituresApi.getAll({ status: 'approved', limit: 1000 }), // Get approved expenditures for retirement
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
    const styles = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-yellow-100 text-yellow-800",
      under_review: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-purple-100 text-purple-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const getAvailableExpenditures = () => {
    return expenditures.filter(exp => {
      // Filter out expenditures that already have retirements
      const hasRetirement = retirements.some(ret => ret.expenditureId === exp.id);
      return !hasRetirement;
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expenditure Retirements</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Retirement
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search retirements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      </div>

      {/* Retirements Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading retirements...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={loadData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : retirements.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No retirements found. Create your first retirement to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retirement Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expenditure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Retired
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {retirements.map((retirement) => (
                <tr key={retirement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {retirement.retirementNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {retirement.expenditure?.referenceNumber || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${retirement.amountRetired.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate">{retirement.purpose}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getStatusBadge(retirement.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(retirement.retirementDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRetirement(retirement);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {retirement.status === 'draft' && (
                        <button
                          onClick={() => handleSubmit(retirement)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Submit
                        </button>
                      )}
                      {(retirement.status === 'under_review' || retirement.status === 'submitted') && (
                        <>
                          <button
                            onClick={() => handleApprove(retirement)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(retirement)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an expenditure</option>
              {getAvailableExpenditures().map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.referenceNumber} - ${exp.amount.toLocaleString()} - {exp.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Retire *
            </label>
            <input
              type="number"
              value={formData.amountRetired}
              onChange={(e) => setFormData({ ...formData, amountRetired: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter amount"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retirement Date *
            </label>
            <input
              type="date"
              value={formData.retirementDate}
              onChange={(e) => setFormData({ ...formData, retirementDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose *
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter purpose of retirement"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter additional remarks (optional)"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
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
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Retirement"}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRetirement(null);
        }}
        title="Retirement Details"
      >
        {selectedRetirement && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Retirement Number</h3>
              <p className="text-sm text-gray-900">{selectedRetirement.retirementNumber}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Expenditure</h3>
              <p className="text-sm text-gray-900">
                {selectedRetirement.expenditure?.referenceNumber || 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Amount Retired</h3>
              <p className="text-sm text-gray-900">${selectedRetirement.amountRetired.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Balance Unretired</h3>
              <p className="text-sm text-gray-900">${selectedRetirement.balanceUnretired.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Purpose</h3>
              <p className="text-sm text-gray-900">{selectedRetirement.purpose}</p>
            </div>
            {selectedRetirement.remarks && (
              <div>
                <h3 className="text-sm font-medium text-gray-700">Remarks</h3>
                <p className="text-sm text-gray-900">{selectedRetirement.remarks}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-700">Status</h3>
              <div className="mt-1">{getStatusBadge(selectedRetirement.status)}</div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Retirement Date</h3>
              <p className="text-sm text-gray-900">
                {new Date(selectedRetirement.retirementDate).toLocaleDateString()}
              </p>
            </div>
            {selectedRetirement.rejectionReason && (
              <div>
                <h3 className="text-sm font-medium text-gray-700">Rejection Reason</h3>
                <p className="text-sm text-red-600">{selectedRetirement.rejectionReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
