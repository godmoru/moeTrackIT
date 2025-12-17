export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'hon_commissioner'
  | 'perm_secretary'
  | 'dfa'
  | 'director'
  | 'hq_cashier'
  | 'principal'
  | 'area_education_officer'
  | 'cashier'
  | 'officer'
  | 'user';

export type UserStatus = 'active' | 'disabled';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignedLgas?: LGA[];
  institutionId?: string;
  institution?: {
    id: string;
    name: string;
    lgaId: string;
  };
}

export interface LGA {
  id: string;
  name: string;
  code: string;
  stateId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AEOAssignmentHistory {
  id: string;
  userId: string;
  lgaId: string;
  assignedById: string;
  assignedAt: Date;
  removedAt?: Date;
  removedById?: string;
  isCurrent: boolean;
  lga: LGA;
  assignedBy: {
    id: string;
    name: string;
  };
  removedBy?: {
    id: string;
    name: string;
  };
}

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password?: string;
  status?: UserStatus;
  lgaIds?: string[]; // For AEO role
  institutionId?: string; // For Principal role
}

export interface UpdateUserData extends Partial<Omit<CreateUserData, 'password'>> {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}
