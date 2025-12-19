import axios from 'axios';
import type {
    BudgetLineItem,
    Expenditure,
    ExpenditureRetirement,
    PaginatedResponse,
    ApiResponse,
    BudgetLineItemUtilization,
    Attachment,
    DashboardStats,
    EarlyWarning,
} from '@/types/expenditure.types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Budget Line Items API
export const budgetLineItemsApi = {
    getAll: (params?: any) =>
        api.get<PaginatedResponse<BudgetLineItem>>('/line-items', { params }),

    getById: (id: number, includeExpenditures = false) =>
        api.get<ApiResponse<{ lineItem: BudgetLineItem }>>(`/line-items/${id}`, {
            params: { includeExpenditures },
        }),

    create: (data: any) =>
        api.post<ApiResponse<{ lineItem: BudgetLineItem }>>('/line-items', data),

    update: (id: number, data: any) =>
        api.patch<ApiResponse<{ lineItem: BudgetLineItem }>>(`/line-items/${id}`, data),

    delete: (id: number) =>
        api.delete(`/line-items/${id}`),

    getUtilization: (id: number) =>
        api.get<ApiResponse<{ stats: BudgetLineItemUtilization }>>(`/line-items/${id}/utilization`),

    recalculateBalance: (id: number) =>
        api.post<ApiResponse<{ balance: number }>>(`/line-items/${id}/recalculate-balance`),
};

// Expenditures API
export const expendituresApi = {
    getAll: (params?: any) =>
        api.get<PaginatedResponse<Expenditure>>('/expenditures', { params }),

    getById: (id: string, options?: { includeAttachments?: boolean; includeRetirement?: boolean }) =>
        api.get<ApiResponse<{ expenditure: Expenditure }>>(`/expenditures/${id}`, {
            params: options,
        }),

    create: (data: any) =>
        api.post<ApiResponse<{ expenditure: Expenditure }>>('/expenditures', data),

    update: (id: string, data: any) =>
        api.patch<ApiResponse<{ expenditure: Expenditure }>>(`/expenditures/${id}`, data),

    delete: (id: string) =>
        api.delete(`/expenditures/${id}`),

    submit: (id: string) =>
        api.post<ApiResponse<{ expenditure: Expenditure }>>(`/expenditures/${id}/submit`),

    approve: (id: string) =>
        api.post<ApiResponse<{ expenditure: Expenditure }>>(`/expenditures/${id}/approve`),

    reject: (id: string, reason: string) =>
        api.post<ApiResponse<{ expenditure: Expenditure }>>(`/expenditures/${id}/reject`, { reason }),

    getStats: (params?: any) =>
        api.get('/expenditures/stats', { params }),
};

// Retirements API
export const retirementsApi = {
    getAll: (params?: any) =>
        api.get<PaginatedResponse<ExpenditureRetirement>>('/retirements', { params }),

    getById: (id: string, includeAttachments = true) =>
        api.get<ApiResponse<{ retirement: ExpenditureRetirement }>>(`/retirements/${id}`, {
            params: { includeAttachments },
        }),

    create: (data: any) =>
        api.post<ApiResponse<{ retirement: ExpenditureRetirement }>>('/retirements', data),

    update: (id: string, data: any) =>
        api.patch<ApiResponse<{ retirement: ExpenditureRetirement }>>(`/retirements/${id}`, data),

    submit: (id: string) =>
        api.post<ApiResponse<{ retirement: ExpenditureRetirement }>>(`/retirements/${id}/submit`),

    review: (id: string, status: string, remarks?: string) =>
        api.post<ApiResponse<{ retirement: ExpenditureRetirement }>>(`/retirements/${id}/review`, {
            status,
            remarks,
        }),

    approve: (id: string) =>
        api.post<ApiResponse<{ retirement: ExpenditureRetirement }>>(`/retirements/${id}/approve`),

    reject: (id: string, reason: string) =>
        api.post<ApiResponse<{ retirement: ExpenditureRetirement }>>(`/retirements/${id}/reject`, {
            reason,
        }),

    getStats: (params?: any) =>
        api.get('/retirements/stats', { params }),
};

// Attachments API
export const attachmentsApi = {
    uploadExpenditure: (expenditureId: string, file: File, documentType: string, description?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        if (description) formData.append('description', description);

        return api.post<ApiResponse<{ attachment: Attachment }>>(
            `/attachments/expenditures/${expenditureId}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
    },

    uploadRetirement: (retirementId: string, file: File, documentType: string, description?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        if (description) formData.append('description', description);

        return api.post(
            `/attachments/retirements/${retirementId}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
    },

    getByExpenditure: (expenditureId: string) =>
        api.get<ApiResponse<{ attachments: Attachment[] }>>(`/attachments/expenditures/${expenditureId}`),

    getByRetirement: (retirementId: string) =>
        api.get(`/attachments/retirements/${retirementId}`),

    download: (id: string) =>
        api.get(`/attachments/${id}`, { responseType: 'blob' }),

    delete: (id: string) =>
        api.delete(`/attachments/${id}`),
};

// Dashboard API
export const dashboardApi = {
    getBudgetOverview: (params?: { mdaId?: string; fiscalYear?: number }) =>
        api.get('/dashboard/budget-overview', { params }),

    getExpenditureSummary: (params?: any) =>
        api.get('/dashboard/expenditure-summary', { params }),

    getBudgetUtilization: (params?: { budgetId?: number; mdaId?: string }) =>
        api.get('/dashboard/budget-utilization', { params }),

    getRetirementStatus: (params?: any) =>
        api.get('/dashboard/retirement-status', { params }),

    getEarlyWarnings: (params?: { mdaId?: string }) =>
        api.get<ApiResponse<{ warnings: EarlyWarning[] }>>('/dashboard/early-warnings', { params }),

    getMdaDashboard: (mdaId: string, params?: { fiscalYear?: number }) =>
        api.get<ApiResponse<DashboardStats>>(`/dashboard/mda/${mdaId}`, { params }),
};
