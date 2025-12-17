'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';
import { PlusIcon, PencilIcon, TrashIcon, UserIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useApi } from '@/hooks/useApi';
import { User, UserRole, CreateUserData } from '@/types/user';
import { toast } from 'sonner';
import { UserForm } from '@/components/forms/UserForm';
import { AEOAssignmentManager } from '@/components/admin/AEOAssignmentManager';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';

// Define the type for table cell props
interface TableCellProps {
  value: any;
  row: {
    original: User;
  };
}

// Define the type for the row click handler
type RowClickHandler = (row: { original: User }) => void;

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
  
  // Check if current user has admin or super admin role
  const isAdmin = hasRole(['admin', 'super_admin']);
  const router = useRouter();
  // const { get, post, delete: del, loading: isLoading } = useApi();
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAEOAssignmentOpen, setIsAEOAssignmentOpen] = useState(false);
  const [selectedAEO, setSelectedAEO] = useState<User | null>(null);
  
  const { get, post, delete: del, loading: isLoading } = useApi<User[]>();

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
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleUpdateUser = async (userId: string, userData: Partial<User>) => {
    try {
      await post(`/users/${userId}`, { ...userData, _method: 'PUT' });
      toast.success('User updated successfully');
      setIsModalOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (error) {
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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all users including their name, role and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button
            onClick={() => {
              setSelectedUser(null);
              setIsModalOpen(true);
            }}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <Table data={users} isLoading={isLoading}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody
                  data={users}
                  onRowClick={(user: User) => {
                    setSelectedUser(user);
                    setIsModalOpen(true);
                  }}
                >
                  {users.map((user) => {
                    const isActive = user.status === 'active';
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-gray-500" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleColors[user.role]}>
                            {user.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {isActive ? 'Active' : 'Disabled'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                                setIsModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
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
                                className="text-green-600 hover:text-green-900"
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        title={selectedUser ? 'Edit User' : 'Create New User'}
      >
        <UserForm
          key={selectedUser?.id ?? 'new'}
          user={selectedUser || undefined}
          onSubmit={selectedUser ? 
            (data: Partial<User>) => handleUpdateUser(selectedUser.id, data) : 
            handleCreateUser
          }
          isSubmitting={isLoading}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
        />
      </Modal>

      {selectedAEO && (
        <Modal
          isOpen={isAEOAssignmentOpen}
          onClose={() => {
            setIsAEOAssignmentOpen(false);
            setSelectedAEO(null);
          }}
          title={`Manage LGA Assignments - ${selectedAEO.name}`}
          size="xl"
        >
          <AEOAssignmentManager
            userId={selectedAEO.id}
            currentAssignments={selectedAEO.assignedLgas?.map(lga => ({
              id: lga.id,
              userId: selectedAEO.id,
              lgaId: lga.id,
              lga: { 
                id: lga.id, 
                name: lga.name,
                code: lga.code || '',
                stateId: lga.stateId || '',
                createdAt: lga.createdAt || new Date(),
                updatedAt: lga.updatedAt || new Date()
              },
              assignedAt: new Date(),
              assignedById: currentUser?.id || '',
              assignedBy: { 
                id: currentUser?.id || '', 
                name: currentUser?.name || 'System' 
              },
              isCurrent: true
            })) || []}
            onAssignmentChange={(success) => {
              handleAEOAssignmentChange(success);
              if (success) {
                setIsAEOAssignmentOpen(false);
                setSelectedAEO(null);
              }
            }}
          />
        </Modal>
      )}
    </div>
  );
}