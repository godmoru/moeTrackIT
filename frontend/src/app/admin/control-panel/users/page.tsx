'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { twMerge } from 'tailwind-merge';
import { PlusIcon, PencilIcon, TrashIcon, UserIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useApi } from '@/hooks/useApi';
import { User, UserRole, CreateUserData } from '@/types/user';
import { toast } from 'sonner';
import { UserForm } from '@/components/forms/UserForm';
import { AEOAssignmentManager } from '@/components/admin/AEOAssignmentManager';
import { Modal } from '@/components/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';

const roleColors: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  hon_commissioner: 'bg-rose-100 text-rose-800',
  perm_secretary: 'bg-sky-100 text-sky-800',
  dfa: 'bg-amber-100 text-amber-800',
  director: 'bg-indigo-100 text-indigo-800',
  hq_cashier: 'bg-cyan-100 text-cyan-800',
  principal: 'bg-yellow-100 text-yellow-800',
  area_education_officer: 'bg-green-100 text-green-800',
  cashier: 'bg-teal-100 text-teal-800',
  officer: 'bg-gray-100 text-gray-800',
  user: 'bg-slate-100 text-slate-800',
};

export default function UsersPage() {
  const { user: currentUser, hasRole } = useAuth();
  const isAdmin = hasRole(['admin', 'super_admin']);

  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAEOAssignmentOpen, setIsAEOAssignmentOpen] = useState(false);
  const [selectedAEO, setSelectedAEO] = useState<User | null>(null);

  const { get, post, delete: del, loading: isLoading } = useApi<any>();

  const loadUsers = async () => {
    try {
      const data = await get('/users');
      setUsers(data || []);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      toast.error(error.message || 'Failed to load users');
      setUsers([]);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (userData: CreateUserData) => {
    try {
      await post('/users', userData);
      toast.success('User created successfully');
      setIsModalOpen(false);
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      toast.error(error?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (userId: string, userData: Partial<User>) => {
    try {
      await post(`/users/${userId}`, { ...userData, _method: 'PUT' });
      toast.success('User updated successfully');
      setIsModalOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      await del(`/users/${userId}`);
      toast.success('User deleted successfully');
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const openAEOAssignment = (user: User) => {
    if (user.role !== 'area_education_officer') {
      toast.error('Only Area Education Officers can have LGA assignments');
      return;
    }
    setSelectedAEO(user);
    setIsAEOAssignmentOpen(true);
  };

  const handleAEOAssignmentChange = (success: boolean) => {
    if (!success) {
      toast.error('Failed to update AEO assignments');
      return;
    }
    toast.success('AEO assignments updated successfully');
    setIsAEOAssignmentOpen(false);
    setSelectedAEO(null);
    loadUsers();
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Users</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/control-panel/users/new"
            className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800 flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            New User
          </Link>
        </div>
      </div>

      {isLoading && users.length === 0 && (
        <p className="text-sm text-gray-600">Loading users...</p>
      )}

      {!isLoading && users.length === 0 && (
        <p className="text-sm text-gray-600">No users available.</p>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <DataTable
          data={users}
          isLoading={isLoading}
          onRowClick={(user) => openEditModal(user)}
          columns={[
            {
              header: "Name",
              cell: (user) => (
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-500" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-gray-500 text-xs">{user.email}</div>
                  </div>
                </div>
              ),
            },
            {
              header: "Role",
              cell: (user) => (
                <div className={twMerge('text-xs px-2 py-1 rounded inline-flex font-semibold', roleColors[user.role])}>
                  {user.role
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </div>
              ),
            },
            {
              header: "LGA",
              cell: (user) => (
                <span className="text-[11px] text-gray-700">
                  {user.role === 'area_education_officer'
                    ? user.assignedLgas && user.assignedLgas.length > 0
                      ? user.assignedLgas.map((lga) => lga.name).join(', ')
                      : '-'
                    : '-'}
                </span>
              ),
            },
            {
              header: "Status",
              cell: (user) => (
                <span
                  className={twMerge(
                    'px-2 inline-flex text-[11px] leading-5 font-semibold rounded-full',
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  )}
                >
                  {user.status === 'active' ? 'Active' : 'Disabled'}
                </span>
              ),
            },
            {
              header: "Last Login",
              cell: (user) => (
                <div className="text-[11px] text-gray-500">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                </div>
              ),
            },
            {
              header: "Actions",
              cell: (user) => (
                <div className="flex space-x-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(user);
                    }}
                    className="text-green-700 hover:text-green-800"
                    title="Edit"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>

                  {user.role === 'area_education_officer' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAEOAssignment(user);
                      }}
                      className="text-blue-700 hover:text-blue-800"
                      title="Manage LGA Assignments"
                    >
                      <MapPinIcon className="h-5 w-5" />
                    </button>
                  )}

                  {user.id !== currentUser?.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(user.id);
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Edit / Create User Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        title={selectedUser ? 'Edit User' : 'Create New User'}
      >
        <UserForm
          key={selectedUser?.id ?? 'new'}
          user={selectedUser || undefined}
          onSubmit={
            selectedUser
              ? (data: Partial<User>) => handleUpdateUser(selectedUser.id, data)
              : handleCreateUser
          }
          isSubmitting={isLoading}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
        />
      </Modal>

      {/* AEO Assignment Modal – KEY FIX HERE */}
      {selectedAEO && (
        <Modal
          open={isAEOAssignmentOpen}
          onClose={() => {
            setIsAEOAssignmentOpen(false);
            setSelectedAEO(null);
          }}
          title={`Manage LGA Assignments - ${selectedAEO.name}`}
          size="lg"
        >
          <AEOAssignmentManager
            userId={selectedAEO.id}
            currentAssignments={
              selectedAEO.assignedLgas?.map((lga, index) => ({
                // Use lga.id as the unique identifier
                id: lga.id, // ← Critical: ensures unique key in child component
                userId: selectedAEO.id,
                lgaId: lga.id,
                lga: {
                  id: lga.id,
                  name: lga.name,
                  code: lga.code || '',
                  stateId: lga.stateId || '',
                  createdAt: lga.createdAt || new Date(),
                  updatedAt: lga.updatedAt || new Date(),
                },
                assignedAt: new Date(),
                assignedById: currentUser?.id || '',
                assignedBy: {
                  id: currentUser?.id || '',
                  name: currentUser?.name || 'System',
                },
                isCurrent: true,
              })) || []
            }
            onAssignmentChange={(success) => {
              handleAEOAssignmentChange(success);
            }}
          />
        </Modal>
      )}
    </div>
  );
}