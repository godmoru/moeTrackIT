import * as SecureStore from 'expo-secure-store';
import { DashboardSummary, LgaRemittance, Assessment, Payment, User } from '../types';

// Update this to your backend URL
const API_BASE = 'http://localhost:5000/api/v1';


class ApiService {
  private token: string | null = null;

  async init() {
    this.token = await SecureStore.getItemAsync('authToken');
  }

  private async getHeaders(): Promise<Record<string, string>> {
    if (!this.token) {
      this.token = await SecureStore.getItemAsync('authToken');
    }
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  async setToken(token: string) {
    this.token = token;
    await SecureStore.setItemAsync('authToken', token);
  }

  async clearToken() {
    this.token = null;
    await SecureStore.deleteItemAsync('authToken');
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await SecureStore.getItemAsync('authToken');
    }
    return this.token;
  }

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Login failed');
    }
    const data = await res.json();
    await this.setToken(data.token);
    return data;
  }

  async forgotPassword(email: string): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Request failed');
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to change password');
    }
  }

  // Dashboard
  async getSummary(from?: string, to?: string): Promise<DashboardSummary> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    
    const res = await fetch(`${API_BASE}/reports/summary?${params}`, {
      headers: await this.getHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to load summary');
    }
    return res.json();
  }

  async getLgaRemittance(from?: string, to?: string): Promise<{ items: LgaRemittance[] }> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    
    const res = await fetch(`${API_BASE}/reports/remittance-by-lga?${params}`, {
      headers: await this.getHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to load LGA data');
    }
    return res.json();
  }

  // Payments
  async getPayments(params?: { page?: number; limit?: number }): Promise<{ items: Payment[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    const res = await fetch(`${API_BASE}/payments?${query}`, {
      headers: await this.getHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to load payments');
    }
    return res.json();
  }

  async getPayment(id: number): Promise<Payment> {
    const res = await fetch(`${API_BASE}/payments/${id}`, {
      headers: await this.getHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to load payment');
    }
    return res.json();
  }

  async createPayment(data: {
    assessmentId: number;
    amountPaid: number;
    method: string;
    reference?: string;
  }): Promise<Payment> {
    const res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to record payment');
    }
    return res.json();
  }

  // Assessments
  async getAssessments(params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
  }): Promise<{ items: Assessment[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.status) query.set('status', params.status);
    
    const res = await fetch(`${API_BASE}/assessments?${query}`, {
      headers: await this.getHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to load assessments');
    }
    return res.json();
  }

  async getAssessment(id: number): Promise<Assessment> {
    const res = await fetch(`${API_BASE}/assessments/${id}`, {
      headers: await this.getHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to load assessment');
    }
    return res.json();
  }

  // User
  async getProfile(): Promise<User> {
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: await this.getHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to load profile');
    }
    return res.json();
  }
}

export const api = new ApiService();
