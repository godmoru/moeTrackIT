'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useApi } from '@/hooks/useApi';
import { LGA, AEOAssignmentHistory } from '@/types/user';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';

interface AEOAssignmentManagerFormData {
  lgaId: string;
  action: 'assign' | 'unassign';
}

interface LGAWithId extends Omit<LGA, 'id' | 'createdAt' | 'updatedAt'> {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AEOAssignmentManagerProps {
  userId: string;
  currentAssignments?: AEOAssignmentHistory[];
  onAssignmentChange?: (success: boolean) => void;
}

export function AEOAssignmentManager({ userId, currentAssignments = [], onAssignmentChange }: AEOAssignmentManagerProps) {
  const { get, post } = useApi<LGAWithId[] | AEOAssignmentHistory[]>();
  const [lgas, setLgas] = useState<LGA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assignmentHistory, setAssignmentHistory] = useState<AEOAssignmentHistory[]>(currentAssignments);

  const { handleSubmit, register, reset, watch } = useForm<AEOAssignmentManagerFormData>();

  const action = watch('action', 'assign');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lgasResponse, historyResponse] = await Promise.all([
          get('/lgas'),
          get(`/users/${userId}/assignment-history`)
        ]);
        
        setLgas(lgasResponse?.data || []);
        setAssignmentHistory(historyResponse?.data || []);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, get]);

  const onSubmit = async (data: AEOAssignmentManagerFormData) => {
    try {
      setIsLoading(true);
      const endpoint = data.action === 'assign' 
        ? `/users/${userId}/assign-lga` 
        : `/users/${userId}/unassign-lga`;
      
      await post(endpoint, { lgaId: data.lgaId });
      
      // Refresh the assignment history
      const history = await get(`/users/${userId}/assignment-history`);
      setAssignmentHistory((history?.data as AEOAssignmentHistory[]) || []);
      
      const message = `LGA ${data.action === 'assign' ? 'assigned' : 'unassigned'} successfully`;
      toast.success(message);
      onAssignmentChange?.(true);
      reset();
    } catch (error) {
      console.error(`Failed to ${action} LGA:`, error);
      toast.error(`Failed to ${action} LGA. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const currentAssignmentsList = (assignmentHistory || []).filter((a): a is AEOAssignmentHistory => a.isCurrent);
  const pastAssignments = (assignmentHistory || []).filter((a): a is AEOAssignmentHistory => !a.isCurrent);

  if (isLoading) {
    return <div className="p-4">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Manage LGA Assignments</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                id="action"
                {...register('action')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="assign">Assign LGA</option>
                <option value="unassign">Unassign LGA</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="lgaId" className="block text-sm font-medium text-gray-700 mb-1">
                {action === 'assign' ? 'Select LGA to assign' : 'Select LGA to unassign'}
              </label>
              <select
                id="lgaId"
                {...register('lgaId', { required: true })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={action === 'unassign' && currentAssignmentsList.length === 0}
              >
                <option value="">Select LGA</option>
                {action === 'assign' ? (
                  // Show only unassigned LGAs for assignment
                  lgas
                    .filter(lga => !currentAssignmentsList?.some(a => a.lgaId === lga.id))
                    .map(lga => (
                      <option key={lga.id} value={lga.id}>
                        {lga.name}
                      </option>
                    ))
                ) : (
                  // Show only currently assigned LGAs for unassignment
                  currentAssignmentsList.map(assignment => (
                    <option key={assignment.lgaId} value={assignment.lgaId}>
                      {assignment.lga?.name || 'Unknown LGA'}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading || (action === 'unassign' && currentAssignmentsList.length === 0)}
                className={`px-4 py-2 rounded-md text-white ${
                  action === 'assign' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
              >
                {isLoading ? 'Processing...' : action === 'assign' ? 'Assign LGA' : 'Unassign LGA'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Current LGA Assignments</h3>
        {currentAssignmentsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LGA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentAssignmentsList.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {assignment.lga?.name || 'Unknown LGA'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.assignedBy?.name || 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No current LGA assignments.</p>
        )}
      </div>

      {pastAssignments.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h3 className="text-lg font-medium mb-4">Past LGA Assignments</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LGA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Removed On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Removed By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pastAssignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {assignment.lga?.name || 'Unknown LGA'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.assignedBy?.name || 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.removedAt ? new Date(assignment.removedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.removedBy?.name || 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
