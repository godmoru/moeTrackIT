// Budget Types
export interface Budget {
    id: number;
    mdaId: string;
    fiscalYear: number;
    title: string;
    description?: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'published';
    startDate: string;
    endDate: string;
    totalAmount: number;
    approvedAmount?: number;
    approvedBy?: string;
    approvedAt?: string;
    createdAt: string;
    updatedAt: string;
}

// Budget Line Item Types
export interface BudgetLineItem {
    id: number;
    code: string;
    name: string;
    description?: string;
    budgetId: number;
    mdaId: string;
    category: 'personnel' | 'overhead' | 'recurrent' | 'capital';
    amount: number;
    balance: number;
    fiscalYear: number;
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    utilizationPercentage?: number;
    createdAt: string;
    updatedAt: string;
}

export interface BudgetLineItemUtilization {
    amount: number;
    balance: number;
    spent: number;
    utilizationPercentage: number;
    warningStatus: {
        level: 'normal' | 'medium' | 'high' | 'critical';
        threshold: number;
    };
}

// Expenditure Types
export interface Expenditure {
    id: string;
    budgetLineItemId: number;
    budgetId?: number;
    mdaId: string;
    amount: number;
    description: string;
    date: string;
    referenceNumber: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    paymentVoucherNumber?: string;
    paymentVoucherDate?: string;
    paymentVoucherAmount?: number;
    paymentVoucherDescription?: string;
    paymentDate?: string;
    beneficiaryName?: string;
    beneficiaryAccountNumber?: string;
    beneficiaryBank?: string;
    createdBy: string;
    updatedBy?: string;
    createdAt: string;
    updatedAt: string;
    attachments?: Attachment[];
    retirement?: ExpenditureRetirement;
    lineItem?: BudgetLineItem;
    mda?: MDA;
}

// Expenditure Retirement Types
export interface ExpenditureRetirement {
    id: string;
    expenditureId: string;
    retirementNumber: string;
    retirementDate: string;
    status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';
    amountRetired: number;
    balanceUnretired: number;
    purpose: string;
    remarks?: string;
    rejectionReason?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    approvedBy?: string;
    approvedAt?: string;
    createdBy: string;
    updatedBy?: string;
    createdAt: string;
    updatedAt: string;
    attachments?: RetirementAttachment[];
    expenditure?: Expenditure;
}

// Attachment Types
export interface Attachment {
    id: string;
    expenditureId: string;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    description?: string;
    documentType: 'approval' | 'invoice' | 'receipt' | 'payment_voucher' | 'delivery_note' | 'other';
    uploadedBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface RetirementAttachment {
    id: string;
    retirementId: string;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    description?: string;
    documentType: 'receipt' | 'invoice' | 'delivery_note' | 'payment_proof' | 'other';
    uploadedBy: string;
    createdAt: string;
    updatedAt: string;
}

// MDA Type
export interface MDA {
    id: string;
    name: string;
    code: string;
    description?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// API Response Types
export interface PaginatedResponse<T> {
    status: string;
    totalItems: number;
    items: T[];
    totalPages: number;
    currentPage: number;
}

export interface ApiResponse<T> {
    status: string;
    data: T;
    message?: string;
}

// Dashboard Types
export interface DashboardStats {
    budgetOverview?: {
        totalBudget: number;
        totalSpent: number;
        totalBalance: number;
    };
    expenditureStats?: {
        totalExpenditures: number;
        approvedExpenditures: number;
        pendingExpenditures: number;
        totalAmount: number;
    };
    retirementStats?: {
        totalRetirements: number;
        approvedRetirements: number;
        pendingRetirements: number;
        totalAmountRetired: number;
    };
    warnings?: EarlyWarning[];
}

export interface EarlyWarning {
    lineItemId: number;
    lineItemCode: string;
    lineItemName: string;
    mdaName?: string;
    budgetTitle?: string;
    fiscalYear: number;
    utilizationPercentage: number;
    threshold: number;
    level: 'medium' | 'high' | 'critical';
    amount: number;
    balance: number;
}

// Form Types
export interface BudgetLineItemFormData {
    code: string;
    name: string;
    description?: string;
    budgetId: number;
    mdaId: string;
    category: 'personnel' | 'overhead' | 'recurrent' | 'capital';
    amount: number;
    fiscalYear: number;
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
}

export interface ExpenditureFormData {
    budgetLineItemId: number;
    mdaId: string;
    amount: number;
    description: string;
    date?: string;
    beneficiaryName?: string;
    beneficiaryAccountNumber?: string;
    beneficiaryBank?: string;
    paymentVoucherNumber?: string;
    paymentVoucherDate?: string;
    paymentVoucherAmount?: number;
    paymentVoucherDescription?: string;
}

export interface RetirementFormData {
    expenditureId: string;
    amountRetired: number;
    purpose: string;
    remarks?: string;
    retirementDate?: string;
}
