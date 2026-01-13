'use client';

import { useMemo } from 'react';
import type { TechnicianPerformance, RevenueDataPoint, ServiceRecordStatus, ServiceRecord } from '@/lib/types';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Wrench } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { format } from 'date-fns';

function useDashboardData(serviceRecords: ServiceRecord[] | null) {
  return useMemo(() => {
    if (!serviceRecords) {
      return {
        technicianPerformance: [],
        revenueData: [],
        statusData: [],
        totalRevenue: 0,
        totalCustomers: 0,
        totalJobs: 0,
      };
    }

    const technicians: { [key: string]: TechnicianPerformance } = {};
    const revenueByMonth: { [key: string]: number } = {};
    const statusCounts: { [key in ServiceRecordStatus]?: number } = {};
    let totalRevenue = 0;

    serviceRecords.forEach(record => {
      const recordDate = record.date instanceof Date ? record.date : (record.date as any).toDate();

      // Technician Performance
      if (!technicians[record.technician]) {
        technicians[record.technician] = { technician: record.technician, totalJobs: 0, totalRevenue: 0 };
      }
      technicians[record.technician].totalJobs += 1;
      technicians[record.technician].totalRevenue += record.total;

      // Revenue over time
      if (record.status === 'Paid') {
        const month = format(recordDate, 'yyyy-MM');
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
      if (record.status) {
        statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
      }
    });

    const technicianPerformance = Object.values(technicians).sort((a, b) => b.totalRevenue - a.totalRevenue);
    const revenueData: RevenueDataPoint[] = Object.entries(revenueByMonth)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count!,
    }));
    
    const totalCustomers = new Set(serviceRecords.map(r => r.customer)).size;

    return { technicianPerformance, revenueData, statusData, totalRevenue, totalCustomers, totalJobs: serviceRecords.length };
  }, [serviceRecords]);
}

export default function DashboardPage() {
  const { firestore, user } = useFirebase();

  const serviceRecordsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'technicians', user.uid, 'serviceRecords'));
  }, [firestore, user]);

  const { data: serviceRecords, isLoading } = useCollection<ServiceRecord>(serviceRecordsQuery);

  const { technicianPerformance, revenueData, statusData, totalRevenue, totalCustomers, totalJobs } = useDashboardData(serviceRecords);

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

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
