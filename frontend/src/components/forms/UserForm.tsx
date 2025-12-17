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
  lgaId: yup.string().when(['role', '$isNewUser'], ([role, isNewUser], schema) => {
    if (role === 'area_education_officer' && isNewUser) {
      return schema.required('LGA is required');
    }
    return schema.notRequired();
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
    setValue,
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
      lgaId: user?.role === 'area_education_officer' ? user.assignedLgas?.[0]?.id || '' : '',
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
        lgaId: user.role === 'area_education_officer' ? user.assignedLgas?.[0]?.id || '' : '',
        institutionId: user.institutionId || '',
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        role: 'officer',
        status: 'active',
        lgaId: '',
        institutionId: '',
        password: undefined,
        confirmPassword: undefined,
      } as any);
    }
  }, [user, reset]);

  useEffect(() => {
    if (selectedRole !== 'area_education_officer') {
      setValue('lgaId', '', { shouldValidate: false });
    }
  }, [selectedRole, setValue]);

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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 text-xs">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="name" className="block text-[11px] font-medium text-gray-700">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            {...register('name')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            placeholder="Full name"
          />
          {errors.name && (
            <p className="text-[11px] text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-[11px] font-medium text-gray-700">
            Email *
          </label>
          <input
            type="email"
            id="email"
            {...register('email')}
            disabled={!!user}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="name@domain.com"
          />
          {errors.email && (
            <p className="text-[11px] text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="phone" className="block text-[11px] font-medium text-gray-700">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            {...register('phone')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            placeholder="Phone number (optional)"
          />
          {errors.phone && (
            <p className="text-[11px] text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="role" className="block text-[11px] font-medium text-gray-700">
            Role *
          </label>
          <select
            id="role"
            {...register('role')}
            disabled={!!user}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 disabled:bg-gray-100 disabled:text-gray-500"
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
            <p className="text-[11px] text-red-600">{errors.role.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="status" className="block text-[11px] font-medium text-gray-700">
            Status *
          </label>
          <select
            id="status"
            {...register('status')}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'active' ? 'Active' : 'Disabled'}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="text-[11px] text-red-600">{errors.status.message}</p>
          )}
        </div>

        {selectedRole === 'area_education_officer' && (
          <div className="space-y-1 md:col-span-2">
            <label htmlFor="lgaId" className="block text-[11px] font-medium text-gray-700">
              LGA {!user ? '*' : ''}
            </label>
            <select
              id="lgaId"
              {...register('lgaId')}
              disabled={!!user}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">-- Select LGA --</option>
              {lgas.map((lga) => (
                <option key={lga.id} value={lga.id}>
                  {lga.name}
                </option>
              ))}
            </select>
            {isLoading && <p className="text-[11px] text-gray-500">Loading LGAs...</p>}
            {errors.lgaId && <p className="text-[11px] text-red-600">{errors.lgaId.message}</p>}
          </div>
        )}

        {selectedRole === 'principal' && (
          <div className="space-y-1 md:col-span-2">
            <label htmlFor="institutionId" className="block text-[11px] font-medium text-gray-700">
              Institution *
            </label>
            <select
              id="institutionId"
              {...register('institutionId')}
              disabled={!!user}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">-- Select Institution --</option>
              {institutions.map((institution) => (
                <option key={institution.id} value={institution.id}>
                  {institution.name}
                </option>
              ))}
            </select>
            {errors.institutionId && (
              <p className="text-[11px] text-red-600">{errors.institutionId.message}</p>
            )}
          </div>
        )}

        {!user && (
          <>
            <div className="space-y-1">
              <label htmlFor="password" className="block text-[11px] font-medium text-gray-700">
                Password *
              </label>
              <input
                type="password"
                id="password"
                {...register('password')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                placeholder="Minimum 8 characters"
              />
              {errors.password && (
                <p className="text-[11px] text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="block text-[11px] font-medium text-gray-700">
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                {...register('confirmPassword')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                placeholder="Repeat password"
              />
              {errors.confirmPassword && (
                <p className="text-[11px] text-red-600">{errors.confirmPassword.message}</p>
              )}
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
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
