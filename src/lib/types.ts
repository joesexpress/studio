import type { Timestamp } from 'firebase/firestore';

export type ServiceRecordStatus = 'Scheduled' | 'Completed' | 'Paid' | 'Owed' | 'Estimate' | 'No Charge' | 'N/A';

export type ServiceRecord = {
  id: string;
  date: string | Timestamp;
  technician: string;
  customer: string;
  address: string;
  phone: string;
  model: string;
  serial: string;
  filterSize: string;
  freonType: string;
  laborHours: string;
  breakdown: string;
  description: string;
  total: number;
  status: ServiceRecordStatus;
  fileUrl: string;
  summary: string;
  // Firestore specific fields
  technicianId: string;
  customerId: string;
};

export type TechnicianPerformance = {
  technician: string;
  totalJobs: number;
  totalRevenue: number;
};

export type RevenueDataPoint = {
  date: string;
  revenue: number;
};

export type Customer = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  totalJobs: number;
  totalBilled: number;
  records: ServiceRecord[];
};

export type Technician = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

export type ResponsiblePerson = 'Jake' | 'Phil' | 'Derek' | 'FCFS';

export type Todo = {
  id: string;
  task: string;
  isCompleted: boolean;
  createdAt: Timestamp;
  technicianId: string;
  responsible: ResponsiblePerson;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date | Timestamp;
  end: Date | Timestamp;
  description?: string;
  technicianId: string;
};

export type Expense = {
  id: string;
  date: string | Timestamp;
  technicianId: string;
  amount: number;
  description: string;
  vendor: string;
  receiptUrl: string;
  serviceRecordId?: string;
};

export type PriceBookEntry = {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Timestamp;
  technicianId: string;
};

export type TimeLog = {
    id: string;
    technicianId: string;
    timeIn: Timestamp | Date;
    timeOut: Timestamp | Date | null;
    notes: string;
    totalHours?: number;
};

export type OrderItem = {
    id: string;
    name: string;
    quantity: number;
    accountable: ResponsiblePerson;
    technicianId: string;
};

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined';

export type Quote = {
    id: string;
    customerId: string;
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    quotePrice: number;
    validUntil: Timestamp;
    scopeOfWork: string;
    laborRequired: string;
    materialsNeeded: string;
    status: QuoteStatus;
    createdAt: Timestamp;
    technicianId: string;
};
