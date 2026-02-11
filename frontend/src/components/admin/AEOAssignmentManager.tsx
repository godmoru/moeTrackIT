'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useApi } from '@/hooks/useApi';
import { LGA } from '@/types/user';
import { toast } from 'sonner';

interface AEOAssignmentManagerFormData {
  lgaId: string;
  action: 'assign' | 'unassign';
}

interface LGAWithId extends Omit<LGA, 'id' | 'createdAt' | 'updatedAt'> {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserLgaAssignment = {
  id: string | number;
  userId: string | number;
  lgaId: string | number;
  assignedAt?: string | Date;
  assignedBy?: string | number | null;
  isCurrent?: boolean;
  removedAt?: string | Date | null;
  removedBy?: string | number | null;
  lga?: {
    id: string | number;
    name: string;
    code?: string;
    state?: string;
  };
  assigner?: {
    id: string | number;
    name: string;
    email?: string;
  };
  remover?: {
    id: string | number;
    name: string;
    email?: string;
  };
};

interface AEOAssignmentManagerProps {
  userId: string;
  currentAssignments?: any[];
  onAssignmentChange?: (success: boolean) => void;
}

export function AEOAssignmentManager({ userId, currentAssignments = [], onAssignmentChange }: AEOAssignmentManagerProps) {
  const { get, post, put, delete: del } = useApi<any>();
  const [lgas, setLgas] = useState<LGA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assignmentHistory, setAssignmentHistory] = useState<UserLgaAssignment[]>(currentAssignments as UserLgaAssignment[]);

  const { handleSubmit, register, reset, watch } = useForm<AEOAssignmentManagerFormData>();

  const action = watch('action', 'assign');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lgasResponse, assignmentsResponse] = await Promise.all([
          get('/lgas'),
          get(`/users/${userId}/lgas?includeHistory=1`),
        ]);

        setLgas((Array.isArray(lgasResponse) ? lgasResponse : []) as any);
        setAssignmentHistory((Array.isArray(assignmentsResponse) ? assignmentsResponse : []) as any);
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

      if (data.action === 'assign') {
        await post(`/users/${userId}/lgas`, { lgaId: data.lgaId });
      } else {
        await del(`/users/${userId}/lgas/${data.lgaId}`);
      }

      // Refresh current assignments
      const refreshed = await get(`/users/${userId}/lgas?includeHistory=1`);
      setAssignmentHistory((Array.isArray(refreshed) ? refreshed : []) as any);

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

  const currentAssignmentsList = (assignmentHistory || []).filter((a) => a.isCurrent !== false);
  const pastAssignmentsList = (assignmentHistory || []).filter((a) => a.isCurrent === false);

  if (isLoading) {
    return <div className="p-4 text-xs text-gray-600">Loading assignments...</div>;
  }

  return (
    <div className="space-y-4 text-xs">
      <div className="bg-white p-4 text-xs shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Manage LGA Assignments
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-3 space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_2fr_1fr] md:items-end">
            <div className="space-y-1">
              <label htmlFor="action" className="block text-[11px] font-medium text-gray-700">
                Action
              </label>
              <select
                id="action"
                {...register('action')}
                className="w-full border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="assign">Assign</option>
                <option value="unassign">Unassign</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="lgaId" className="block text-[11px] font-medium text-gray-700">
                LGA
              </label>
              <select
                id="lgaId"
                {...register('lgaId', { required: true })}
                className="w-full border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 disabled:bg-gray-100 disabled:text-gray-500"
                disabled={action === 'unassign' && currentAssignmentsList.length === 0}
              >
                <option value="">-- Select LGA --</option>
                {action === 'assign' ? (
                  lgas
                    .filter(lga => !currentAssignmentsList?.some(a => String(a.lgaId) === String(lga.id)))
                    .map(lga => (
                      <option key={lga.id} value={lga.id}>
                        {lga.name}
                      </option>
                    ))
                ) : (
                  currentAssignmentsList.map(assignment => (
                    <option key={String(assignment.lgaId)} value={String(assignment.lgaId)}>
                      {assignment.lga?.name || 'Unknown LGA'}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1">
              <span className="block text-[11px] font-medium text-transparent">Action</span>
              <button
                type="submit"
                disabled={isLoading || (action === 'unassign' && currentAssignmentsList.length === 0)}
                className={`w-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-70 ${action === 'assign'
                  ? 'bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700'
                  : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600'
                  }`}
              >
                {isLoading ? 'Processing...' : action === 'assign' ? 'Assign LGA' : 'Unassign LGA'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white p-4 text-xs shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Current LGA Assignments
        </h3>

        {currentAssignmentsList.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 font-medium">LGA</th>
                  <th className="px-3 py-2 font-medium">Assigned On</th>
                  <th className="px-3 py-2 font-medium">Assigned By</th>
                </tr>
              </thead>
              <tbody>
                {currentAssignmentsList.map((assignment) => (
                  <tr key={String(assignment.id)} className="border-t text-gray-800">
                    <td className="px-3 py-2 text-xs">{assignment.lga?.name || 'Unknown LGA'}</td>
                    <td className="px-3 py-2 text-xs">
                      {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-xs">{assignment.assigner?.name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-[11px] text-gray-500">No current LGA assignments.</p>
        )}
      </div>

      <div className="bg-white p-4 text-xs shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Past Assignments
        </h3>

        {pastAssignmentsList.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 font-medium">LGA</th>
                  <th className="px-3 py-2 font-medium">Assigned On</th>
                  <th className="px-3 py-2 font-medium">Removed On</th>
                  <th className="px-3 py-2 font-medium">Removed By</th>
                </tr>
              </thead>
              <tbody>
                {pastAssignmentsList.map((assignment) => (
                  <tr key={String(assignment.id)} className="border-t text-gray-800">
                    <td className="px-3 py-2 text-xs">{assignment.lga?.name || 'Unknown LGA'}</td>
                    <td className="px-3 py-2 text-xs">
                      {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {assignment.removedAt ? new Date(assignment.removedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-xs">{assignment.remover?.name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-[11px] text-gray-500">No past assignments.</p>
        )}
      </div>
    </div>
  );
}
