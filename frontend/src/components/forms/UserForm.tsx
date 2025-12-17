'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useApi } from '@/hooks/useApi';
import { User, UserRole, CreateUserData, UserStatus } from '@/types/user';
import { toast } from 'sonner';

const roleOptions: UserRole[] = [
  'super_admin',
  'admin',
  'hon_commissioner',
  'perm_secretary',
  'dfa',
  'director',
  'hq_cashier',
  'principal',
  'area_education_officer',
  'cashier',
  'officer',
  'user',
];

const statusOptions: UserStatus[] = ['active', 'disabled'];

const userSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().matches(/^[0-9+\-\s()]*$/, 'Invalid phone number'),
  role: yup
    .string()
    .oneOf(roleOptions as any, 'Invalid role')
    .required('Role is required'),
  status: yup
    .string()
    .oneOf(statusOptions as any, 'Invalid status')
    .default('active'),
  password: yup.string().when('$isNewUser', {
    is: true,
    then: (schema) => schema.required('Password is required').min(8, 'Password must be at least 8 characters'),
    otherwise: (schema) => schema.notRequired(),
  }),
  confirmPassword: yup.string().when('$isNewUser', {
    is: true,
    then: (schema) =>
      schema
        .required('Please confirm your password')
        .oneOf([yup.ref('password')], 'Passwords must match'),
    otherwise: (schema) => schema.notRequired(),
  }),
  lgaIds: yup.array().of(yup.string()).when('role', {
    is: 'area_education_officer',
    then: (schema) => schema.min(1, 'At least one LGA must be selected'),
    otherwise: (schema) => schema.notRequired()
  }),
  institutionId: yup.string().when('role', {
    is: 'principal',
    then: (schema) => schema.required('Institution is required'),
    otherwise: (schema) => schema.notRequired()
  })
});

interface UserFormProps {
  user?: User;
  onSubmit: (data: CreateUserData) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export function UserForm({ user, onSubmit, isSubmitting, onCancel }: UserFormProps) {
  const { get } = useApi();
  const [lgas, setLgas] = useState<Array<{ id: string; name: string }>>([]);
  const [institutions, setInstitutions] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateUserData & { confirmPassword?: string }>({
    resolver: yupResolver(userSchema as any),
    context: { isNewUser: !user },
    shouldUnregister: true,
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role: user?.role || 'officer',
      status: user?.status || 'active',
      institutionId: user?.institutionId || '',
      // For AEOs, ensure lgaIds is an array
      lgaIds: user?.role === 'area_education_officer' ? user.assignedLgas?.map(l => l.id) || [] : [],
    },
  });

  const selectedRole = watch('role') as UserRole;

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role,
        status: user.status || 'active',
        lgaIds: user.role === 'area_education_officer' ? user.assignedLgas?.map((lga) => lga.id) || [] : [],
        institutionId: user.institutionId || '',
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        role: 'officer',
        status: 'active',
        lgaIds: [],
        institutionId: '',
        password: undefined,
        confirmPassword: undefined,
      } as any);
    }
  }, [user, reset]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Only fetch LGAs if the role is area_education_officer or if we're creating a new user
        if (selectedRole === 'area_education_officer' || !user) {
          const lgasData = (await get('/lgas')) as Array<{ id: string; name: string }>;
          setLgas(lgasData || []);
        }

        // Only fetch institutions if the role is principal or if we're creating a new user
        if (selectedRole === 'principal' || !user) {
          const institutionsData = (await get('/institutions')) as Array<{ id: string; name: string }>;
          setInstitutions(institutionsData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedRole, user, get]);

  const handleFormSubmit = async (data: CreateUserData & { confirmPassword?: string }) => {
    // Remove confirmPassword before submitting
    const { confirmPassword, ...submitData } = data;
    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name *
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="name"
              {...register('name')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email *
          </label>
          <div className="mt-1">
            <input
              type="email"
              id="email"
              {...register('email')}
              disabled={!!user}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <div className="mt-1">
            <input
              type="tel"
              id="phone"
              {...register('phone')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role *
          </label>
          <div className="mt-1">
            <select
              id="role"
              {...register('role')}
              disabled={!!user}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status *
          </label>
          <div className="mt-1">
            <select
              id="status"
              {...register('status')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'active' ? 'Active' : 'Disabled'}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>
        </div>

        {selectedRole === 'area_education_officer' && (
          <div className="sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned LGAs *
            </label>
            {isLoading ? (
              <p>Loading LGAs...</p>
            ) : (
              <div className="space-y-2">
                {lgas.map((lga) => (
                  <div key={lga.id} className="flex items-center">
                    <input
                      id={`lga-${lga.id}`}
                      type="checkbox"
                      value={lga.id}
                      {...register('lgaIds')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`lga-${lga.id}`} className="ml-2 block text-sm text-gray-700">
                      {lga.name}
                    </label>
                  </div>
                ))}
                {errors.lgaIds && (
                  <p className="mt-1 text-sm text-red-600">{(errors.lgaIds as any)?.message}</p>
                )}
              </div>
            )}
          </div>
        )}

        {selectedRole === 'principal' && (
          <div className="sm:col-span-6">
            <label htmlFor="institutionId" className="block text-sm font-medium text-gray-700">
              Institution *
            </label>
            <div className="mt-1">
              <select
                id="institutionId"
                {...register('institutionId')}
                disabled={!!user}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm"
              >
                <option value="">Select Institution</option>
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name}
                  </option>
                ))}
              </select>
              {errors.institutionId && (
                <p className="mt-1 text-sm text-red-600">{errors.institutionId.message}</p>
              )}
            </div>
          </div>
        )}

        {!user && (
          <>
            <div className="sm:col-span-3">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  id="password"
                  {...register('password')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password *
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  id="confirmPassword"
                  {...register('confirmPassword')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {
            if (onCancel) {
              onCancel();
              return;
            }

            window.history.back();
          }}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {user ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>{user ? 'Update User' : 'Create User'}</>
          )}
        </button>
      </div>
    </form>
  );
}
