export type Role = 'Admin' | 'HR' | 'Employee' | 'Team Leader' | 'Operations';
export type Status = 'Pending' | 'Approved' | 'Absconding' | 'Resigned';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ResignationRequest {
  id: string;
  userId: string;
  lastWorkingDay: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Absconding';
  submittedAt: string;
  referenceId?: string;
  clientPhone?: string;
  lockedBy?: string;
  lockedByName?: string;
  lockedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNotes?: string;
  verifiedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  handoverChecklist?: {
    assetsReturned: boolean;
    docsCompleted: boolean;
    knowledgeTransfer: boolean;
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: Status;
  teamLeaderId?: string;
  email?: string;
  department: string;
  password?: string;
  target?: number;
}

export interface TimeLog {
  id: string;
  userId: string;
  clockIn: string; // ISO string
  clockOut?: string; // ISO string
  totalHours?: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
}

export interface DMSDocument {
  id: string;
  title: string;
  filename: string;
  category: string;
  uploadedBy: string;
  uploadDate: string;
  version: number;
}

export interface DMSAuditLog {
  action: string;
  docId: string;
  performedBy: string;
  timestamp: string;
}

export interface DailyTask {
  id: string;
  date: string;
  title: string;
  description: string;
  targetCount: number;
  createdBy: string;
  createdAt: string;
}

export interface TaskReport {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  date: string;
  completedCount: number;
  notes?: string;
  submittedAt: string;
}

export interface ClientAccount {
  id: string;
  clientName: string;
  platform: string;
  status: 'Pending Verification' | 'Verified' | 'Rejected';
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  referenceId?: string;
  clientPhone?: string;
  lockedBy?: string;
  lockedByName?: string;
  lockedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNotes?: string;
  verifiedAt?: string;
}

export interface ConnectedCompany {
  id: string;
  name: string;
  addedBy: string;
  createdAt: string;
}

export interface MeetingNote {
  id: string;
  title: string;
  content: string;
  date: string;
  authorId: string;
  authorName: string;
  readReceipts: string[];
}

export interface RegularizationRequest {
  id: string;
  userId: string;
  date: string;
  reason: string;
  status: LeaveStatus;
  submittedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface RegularizationAuditLog {
  id: string;
  requestId: string;
  userId: string;
  date: string;
  action: 'Approved' | 'Rejected';
  performedBy: string;
  performedByName: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  clientName: string;
  phone: string;
  status: 'Lead' | 'Documents Submitted' | 'Rejected' | 'Account Active';
  assignedTo: string;
  assignedToName: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Dealer {
  id: string;
  businessName: string;
  ownerName: string;
  contactNumber: string;
  location: string;
  status: 'Lead' | 'Onboarding' | 'Active' | 'Rejected';
  assignedTo: string;
  createdAt: string;
}


export interface PayrollRecord {
  id: string;
  userId: string;
  month: string;
  baseSalary: number;
  commissions: number;
  deductions: number;
  netPay: number;
  status: 'Draft' | 'Paid';
  generatedAt: string;
  generatedBy: string;
}

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  category: 'IT Support' | 'HR' | 'Admin' | 'Other';
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: 'Travel' | 'Meals' | 'Office Supplies' | 'Other';
  receiptUrl?: string; // Optional for now
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityId: string;
  entityType: 'Lead' | 'ClientAccount';
  performedBy: string;
  performedByName: string;
  timestamp: string;
  details?: string;
}
