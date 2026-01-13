'use client';

import type { TechnicianPerformance, RevenueDataPoint } from '@/lib/types';
import TechnicianPerformanceChart from './TechnicianPerformanceChart';
import RevenueOverTimeChart from './RevenueOverTimeChart';
import StatusBreakdownChart from './StatusBreakdownChart';

type DashboardClientProps = {
  technicianPerformance: TechnicianPerformance[];
  revenueData: RevenueDataPoint[];
  statusData: { name: string; value: number }[];
};

export default function DashboardClient({ technicianPerformance, revenueData, statusData }: DashboardClientProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TechnicianPerformanceChart data={technicianPerformance} />
      <RevenueOverTimeChart data={revenueData} />
      <StatusBreakdownChart data={statusData} />
    </div>
  );
}
