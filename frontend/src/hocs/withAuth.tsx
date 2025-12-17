'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'super_admin' | 'admin' |'hon_commissioner'| 'dfa' | 'director' | 'hq_cashier' | 'principal' | 'area_education_officer' | 'cashier' |'officer' | 'user';

export function withAuth(
  WrappedComponent: React.ComponentType,
  {
    requiredRoles = [],
    redirectTo = '/login',
    loadingComponent: LoadingComponent,
  }: {
    requiredRoles?: UserRole[];
    redirectTo?: string;
    loadingComponent?: React.ComponentType;
  } = {}
) {
  return function WithAuthWrapper(props: any) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
      if (!authLoading && user) {
        // Check if user has any of the required roles
        const hasRequiredRole =
          requiredRoles.length === 0 || requiredRoles.includes(user.role as UserRole);

        if (!hasRequiredRole) {
          // Redirect to not-authorized page if user doesn't have required role
          router.push('/admin/not-authorized');
          return;
        }

        setIsAuthorized(true);
      } else if (!authLoading && !user) {
        // Redirect to login if not authenticated
        router.push(redirectTo);
      }
    }, [user, authLoading, requiredRoles, router, redirectTo]);

    // Show loading state
    if (authLoading || isAuthorized === null) {
      return LoadingComponent ? (
        <LoadingComponent />
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      );
    }

    // If user is not authorized, don't render the component
    if (!isAuthorized) {
      return null;
    }

    // If authorized, render the wrapped component
    return <WrappedComponent {...props} />;
  };
}

// Example usage:
/*
// pages/protected-page.tsx
import { withAuth } from '@/hocs/withAuth';

function ProtectedPage() {
  return <div>This is a protected page</div>;
}

export default withAuth(ProtectedPage, {
  requiredRoles: ['admin', 'super_admin'],
  redirectTo: '/login',
});
*/
