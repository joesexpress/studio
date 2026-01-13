
'use client';

import { useMemo, useState, useEffect } from 'react';
import type { TechnicianPerformance, RevenueDataPoint, ServiceRecordStatus, ServiceRecord } from '@/lib/types';
import DashboardClient from '@/components/dashboard/DashboardClient';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Wrench } from 'lucide-react';
import { format, isWithinInterval } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useFirebase } from '@/firebase';
import { collectionGroup, getDocs, query } from 'firebase/firestore';


function useDashboardData(
  serviceRecords: ServiceRecord[] | null,
  filters: { dateRange: DateRange | undefined, technician: string, status: string }
) {
  return useMemo(() => {
    if (!serviceRecords) {
      return {
        technicianPerformance: [],
        revenueData: [],
        statusData: [],
        totalRevenue: 0,
        totalCustomers: 0,
        totalJobs: 0,
        uniqueTechnicians: [],
      };
    }
    
    const uniqueTechnicians = Array.from(new Set(serviceRecords.map(r => r.technician).filter(Boolean))).sort();

    const filteredRecords = serviceRecords.filter(record => {
      const recordDate = record.date ? (typeof record.date === 'string' ? new Date(record.date) : (record.date as any).toDate()) : new Date();

      const dateMatch = !filters.dateRange?.from || !filters.dateRange?.to || isWithinInterval(recordDate, { start: filters.dateRange.from, end: filters.dateRange.to });
      const techMatch = !filters.technician || record.technician === filters.technician;
      const statusMatch = !filters.status || record.status === filters.status;
      
      return dateMatch && techMatch && statusMatch;
    });

    const technicians: { [key: string]: TechnicianPerformance } = {};
    const revenueByMonth: { [key: string]: number } = {};
    const statusCounts: { [key in ServiceRecordStatus]?: number } = {};
    let totalRevenue = 0;

    filteredRecords.forEach(record => {
      const recordDate = record.date ? (typeof record.date === 'string' ? new Date(record.date) : (record.date as any).toDate()) : new Date();

      // Technician Performance
      if (record.technician) {
        if (!technicians[record.technician]) {
            technicians[record.technician] = { technician: record.technician, totalJobs: 0, totalRevenue: 0 };
        }
        technicians[record.technician].totalJobs += 1;
        technicians[record.technician].totalRevenue += record.total;
      }

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
      name: status as string,
      value: count!,
    }));
    
    const totalCustomers = new Set(filteredRecords.map(r => r.customer)).size;

    return { technicianPerformance, revenueData, statusData, totalRevenue, totalCustomers, totalJobs: filteredRecords.length, uniqueTechnicians };
  }, [serviceRecords, filters]);
}

export default function DashboardPage() {
  const [filters, setFilters] = useState({
    dateRange: undefined as DateRange | undefined,
    technician: '',
    status: '',
  });

  const { firestore } = useFirebase();
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllRecords = async () => {
        if (!firestore) return;
        setIsLoading(true);
        try {
            const recordsQuery = query(collectionGroup(firestore, 'serviceRecords'));
            const snapshot = await getDocs(recordsQuery);
            const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord));
            setServiceRecords(records);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }
    fetchAllRecords();
  }, [firestore]);


  const { technicianPerformance, revenueData, statusData, totalRevenue, totalCustomers, totalJobs, uniqueTechnicians } = useDashboardData(serviceRecords, filters);

  if (isLoading) {
    return <div>Loading dashboard data...</div>
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Analytics for your service records.</p>
        </div>
      </div>

      <DashboardFilters 
        filters={filters}
        onFiltersChange={setFilters}
        technicians={uniqueTechnicians}
      />

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
            <p className="text-xs text-muted-foreground">Based on selected filters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalJobs}</div>
            <p className="text-xs text-muted-foreground">Based on selected filters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Based on selected filters</p>
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
