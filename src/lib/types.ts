import type { Timestamp } from 'firebase/firestore';

export type ServiceRecordStatus = 'Paid' | 'Owed' | 'Estimate' | 'No Charge' | 'N/A';

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
  technicianId?: string;
  customerId?: string;
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
