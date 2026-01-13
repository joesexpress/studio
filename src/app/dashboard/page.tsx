
'use client';

import { useMemo, useState, useEffect } from 'react';
import type { TechnicianPerformance, RevenueDataPoint, ServiceRecordStatus, ServiceRecord, Customer } from '@/lib/types';
import DashboardClient from '@/components/dashboard/DashboardClient';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Wrench, UserMinus, UserCheck } from 'lucide-react';
import { format, isWithinInterval, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useFirebase, useUser } from '@/firebase';
import { collectionGroup, getDocs, query, collection } from 'firebase/firestore';


function useDashboardData(
  serviceRecords: ServiceRecord[] | null,
  allCustomers: Customer[] | null,
  filters: { dateRange: DateRange | undefined, technician: string, status: string }
) {
  return useMemo(() => {
    if (!serviceRecords || !allCustomers) {
      return {
        technicianPerformance: [],
        revenueData: [],
        statusData: [],
        totalRevenue: 0,
        totalCustomers: 0,
        totalJobs: 0,
        uniqueTechnicians: [],
        inactiveCustomers: 0,
        totalCustomerCount: 0,
        isDataReady: false,
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

    // --- Global Metrics (unfiltered) ---
    const totalCustomerCount = allCustomers.length;
    let inactiveCustomers = 0;
    const cutoffDate = subDays(new Date(), 180);
    const customerLastService: { [key: string]: Date } = {};

    serviceRecords.forEach(record => {
        const recordDate = record.date ? (typeof record.date === 'string' ? new Date(record.date) : (record.date as any).toDate()) : new Date();
        if (!customerLastService[record.customerId] || recordDate > customerLastService[record.customerId]) {
            customerLastService[record.customerId] = recordDate;
        }
    });

    allCustomers.forEach(customer => {
        const lastService = customerLastService[customer.id];
        if (!lastService || lastService < cutoffDate) {
            inactiveCustomers++;
        }
    });

    // --- Filtered Metrics ---
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

    return { 
        technicianPerformance, 
        revenueData, 
        statusData, 
        totalRevenue, 
        totalCustomers, 
        totalJobs: filteredRecords.length, 
        uniqueTechnicians,
        inactiveCustomers,
        totalCustomerCount,
        isDataReady: true,
    };
  }, [serviceRecords, allCustomers, filters]);
}

export default function DashboardPage() {
  const [filters, setFilters] = useState({
    dateRange: undefined as DateRange | undefined,
    technician: '',
    status: '',
  });

  const { firestore } = useFirebase();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[] | null>(null);
  const [allCustomers, setAllCustomers] = useState<Customer[] | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
        if (!firestore || !user) return;
        setIsDataLoading(true);
        try {
            // Fetch all customers first
            const customersQuery = query(collection(firestore, 'customers'));
            const customersSnapshot = await getDocs(customersQuery);
            const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
            setAllCustomers(customers);

            // Then fetch all service records from each customer's subcollection
            const allRecords: ServiceRecord[] = [];
            for (const customer of customers) {
                const recordsRef = collection(firestore, 'customers', customer.id, 'serviceRecords');
                const recordsSnapshot = await getDocs(recordsRef);
                recordsSnapshot.forEach(doc => {
                    allRecords.push({ id: doc.id, ...doc.data() } as ServiceRecord);
                });
            }
            setServiceRecords(allRecords);

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsDataLoading(false);
        }
    }
    
    if (!isAuthLoading && user) {
        fetchAllData();
    } else if (!isAuthLoading && !user) {
        setIsDataLoading(false);
        setServiceRecords([]);
        setAllCustomers([]);
    }
  }, [firestore, user, isAuthLoading]);


  const { 
    technicianPerformance, 
    revenueData, 
    statusData, 
    totalRevenue, 
    totalCustomers, 
    totalJobs, 
    uniqueTechnicians,
    inactiveCustomers,
    totalCustomerCount,
    isDataReady,
} = useDashboardData(serviceRecords, allCustomers, filters);

  const isLoading = isAuthLoading || isDataLoading;

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Analytics for your service business.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : totalCustomerCount}</div>
            <p className="text-xs text-muted-foreground">All-time total registered customers.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Customers</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : inactiveCustomers}</div>
            <p className="text-xs text-muted-foreground">Not serviced in last 180 days.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalRevenue)}
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
            <div className="text-2xl font-bold">+{isLoading ? '...' : totalJobs}</div>
            <p className="text-xs text-muted-foreground">Based on selected filters</p>
          </CardContent>
        </Card>
      </div>

      <DashboardFilters 
        filters={filters}
        onFiltersChange={setFilters}
        technicians={uniqueTechnicians}
      />

      {isLoading && (
        <div className="text-center p-8">
            <p>Loading dashboard data...</p>
        </div>
      )}

      {!isLoading && isDataReady && (
        <DashboardClient 
            technicianPerformance={technicianPerformance}
            revenueData={revenueData}
            statusData={statusData}
        />
      )}
    </div>
  );
}
