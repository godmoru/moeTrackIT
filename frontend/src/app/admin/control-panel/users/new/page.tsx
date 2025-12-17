'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';
import { UserForm } from '@/components/forms/UserForm';
import { CreateUserData } from '@/types/user';

export default function NewUserPage() {
  const router = useRouter();
  const { post, loading } = useApi();

  const handleCreateUser = async (userData: CreateUserData) => {
    try {
      await post('/users', userData);
      toast.success('User created successfully');
      router.push('/admin/control-panel/users');
    } catch (error: any) {
      console.error('Failed to create user:', error);
      toast.error(error?.message || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">New User</h1>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      <div className="rounded-lg bg-white p-4 text-xs shadow-sm">
        <UserForm
          onSubmit={handleCreateUser}
          isSubmitting={loading}
          onCancel={() => router.push('/admin/control-panel/users')}
        />
      </div>
    </div>
  );
}
