import React, { createContext, useContext, useState, useEffect, ReactNode } from '../../_node_modules/@types/react';
import { api } from '../services/api';
import { User } from '../types';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface JwtPayload {
  id: number;
  email: string;
  role: string;
  name?: string;
  lgaId?: number;
  entityId?: number;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await api.getToken();
      if (token) {
        const decoded = jwtDecode<JwtPayload>(token);
        setUser({
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name || decoded.email,
          lgaId: decoded.lgaId,
          entityId: decoded.entityId,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await api.clearToken();
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const { token, user: userData } = await api.login(email, password);
    const decoded = jwtDecode<JwtPayload>(token);
    setUser({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name || userData?.name || decoded.email,
      lgaId: decoded.lgaId,
      entityId: decoded.entityId,
    });
  }

  async function logout() {
    await api.clearToken();
    setUser(null);
  }

  async function refreshUser() {
    await checkAuth();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
