export type ServiceRecordStatus = 'Paid' | 'Owed' | 'Estimate' | 'No Charge';

export type ServiceRecord = {
  id: string;
  date: string;
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
  name: string;
  address: string;
  phone: string;
  totalJobs: number;
  totalBilled: number;
  records: ServiceRecord[];
};
