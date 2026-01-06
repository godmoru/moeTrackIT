'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { fetchWithErrorHandling } from '@/lib/apiErrorHandler';

type UserRole = 'super_admin' | 'system_admin' | 'admin' | 'hon_commissioner' | 'perm_secretary' | 'dfa' | 'director' | 'principal' | 'area_education_officer' | 'officer' | 'hq_cashier' | 'cashier' | 'user';

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage/session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for token in localStorage
        const token = localStorage.getItem('authToken');

        if (token) {
          // Verify token with backend
          // console.log(`The user token is ${token}.`);

          const userData = await fetchWithErrorHandling(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (userData) {
            setUser(userData);
          } else {
            // Invalid token, clear it
            localStorage.removeItem('authToken');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await fetchWithErrorHandling(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (data && data.token) {
        // Store the token
        localStorage.setItem('authToken', data.token);

        // Set the user
        setUser(data.user);

        // Redirect to dashboard or intended URL
        router.push('/dashboard');

        toast.success('Login successful');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Re-throw to be handled by the form
    }
  };

  const logout = () => {
    // Clear the token and user data
    localStorage.removeItem('authToken');
    setUser(null);

    // Redirect to login page
    router.push('/login');

    toast.success('You have been logged out');
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;

    const rolesToCheck = Array.isArray(roles) ? roles : [roles];
    return rolesToCheck.includes(user.role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // If you have a permissions system, implement the check here
    // For now, we'll just check the role
    return true;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
