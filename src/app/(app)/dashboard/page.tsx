import { serviceRecords } from '@/lib/mock-data';
import type { TechnicianPerformance, RevenueDataPoint, ServiceRecordStatus } from '@/lib/types';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Wrench } from 'lucide-react';

// This would typically be a database query
async function getDashboardData() {
  const technicians: { [key: string]: TechnicianPerformance } = {};
  const revenueByMonth: { [key: string]: number } = {};
  const statusCounts: { [key in ServiceRecordStatus]: number } = {
    Paid: 0,
    Owed: 0,
    Estimate: 0,
    'No Charge': 0,
  };
  let totalRevenue = 0;

  serviceRecords.forEach(record => {
    // Technician Performance
    if (!technicians[record.technician]) {
      technicians[record.technician] = { technician: record.technician, totalJobs: 0, totalRevenue: 0 };
    }
    technicians[record.technician].totalJobs += 1;
    technicians[record.technician].totalRevenue += record.total;

    // Revenue over time
    if (record.status === 'Paid') {
      const month = record.date.substring(0, 7); // YYYY-MM
      if (!revenueByMonth[month]) {
        revenueByMonth[month] = 0;
      }
      revenueByMonth[month] += record.total;
    }
    
    // Total Revenue
    if (record.status === 'Paid' || record.status === 'Owed') {
      totalRevenue += record.total;
    }

    // Status Counts
    statusCounts[record.status]++;
  });

  const technicianPerformance = Object.values(technicians).sort((a, b) => b.totalRevenue - a.totalRevenue);
  const revenueData: RevenueDataPoint[] = Object.entries(revenueByMonth)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
  }));
  
  const totalCustomers = new Set(serviceRecords.map(r => r.customer)).size;

  return { technicianPerformance, revenueData, statusData, totalRevenue, totalCustomers, totalJobs: serviceRecords.length };
}

export default async function DashboardPage() {
  const { technicianPerformance, revenueData, statusData, totalRevenue, totalCustomers, totalJobs } = await getDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Based on all paid and owed jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalJobs}</div>
            <p className="text-xs text-muted-foreground">Across all service records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Served this period</p>
          </CardContent>
        </Card>
      </div>
      <DashboardClient 
        technicianPerformance={technicianPerformance}
        revenueData={revenueData}
        statusData={statusData}
      />
    </div>
  );
}
