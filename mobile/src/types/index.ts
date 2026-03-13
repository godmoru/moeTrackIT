export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  lgaId?: number;
  entityId?: number;
}

export interface Entity {
  id: number;
  name: string;
  type: string;
  lgaId: number;
  lga?: Lga;
}

export interface Lga {
  id: number;
  name: string;
  code: string;
}

export interface IncomeSource {
  id: number;
  name: string;
  description?: string;
}

export interface Assessment {
  id: number;
  entityId: number;
  incomeSourceId: number;
  amountAssessed: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
  entity?: Entity;
  incomeSource?: IncomeSource;
}

export interface Payment {
  id: number;
  assessmentId: number;
  amountPaid: number;
  paymentDate: string;
  method: string;
  reference?: string;
  status: 'pending' | 'confirmed' | 'paid' | 'failed';
  recordedBy: number;
  assessment?: Assessment;
  recorder?: User;
  rrr?: string;
  paystackReference?: string;
  paymentType?: string;
}

export interface DashboardSummary {
  totalCollected: number;
  statusCounts: { status: string; count: number }[];
}

export interface LgaRemittance {
  lga: string;
  totalAmount: number;
}

export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  PaymentDetail: { paymentId: number };
  AssessmentDetail: { assessmentId: number };
  LGAList: undefined;
  Institutions: undefined;
  InstitutionDetail: { institutionId: number };
  ChangePassword: undefined;
  Notifications: undefined;
  HelpSupport: undefined;
  About: undefined;
  Reports: undefined;
  ReportDetails: { reportId: string; title: string };
  RecordPayment: { assessmentId: number; amount?: number; incomeSource?: string };
  PaymentWebView: { url: string; gateway: 'paystack' | 'remita'; reference?: string; assessmentId: number };
  PaymentSuccess: { gateway: 'paystack' | 'remita'; reference?: string; assessmentId: number; amount?: number };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Payments: undefined;
  Assessments: undefined;
  Institutions: undefined;
  Profile: undefined;
  Reports: undefined;
  Users: undefined;
};

export type PaymentsStackParamList = {
  PaymentsList: undefined;
  PaymentDetail: { paymentId: number };
  RecordPayment: { assessmentId?: number };
};

export type AssessmentsStackParamList = {
  AssessmentsList: undefined;
  AssessmentDetail: { assessmentId: number };
};
