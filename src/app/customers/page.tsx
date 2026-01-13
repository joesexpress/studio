
'use client';

import type { Customer, ServiceRecord } from '@/lib/types';
import CustomersClient from '@/components/customers/CustomersClient';
import { useFirebase, useUser } from '@/firebase';
import { collection, getDocs, query, collectionGroup } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function CustomersPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomersAndRecords = async () => {
      if (!firestore || !user) return;
      setIsLoading(true);
      try {
        // 1. Fetch all customers and all service records in parallel
        const customersQuery = query(collection(firestore, 'customers'));
        const recordsQuery = query(collectionGroup(firestore, 'serviceRecords'));

        const [customerSnapshot, recordsSnapshot] = await Promise.all([
            getDocs(customersQuery),
            getDocs(recordsQuery)
        ]);

        const customerList = customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
        const recordList = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord));
        
        // 2. Create a map of records by customerId for efficient lookup
        const recordsByCustomer = new Map<string, ServiceRecord[]>();
        for (const record of recordList) {
            if (!recordsByCustomer.has(record.customerId)) {
                recordsByCustomer.set(record.customerId, []);
            }
            recordsByCustomer.get(record.customerId)!.push(record);
        }

        // 3. Combine customers with their records and calculate aggregates
        const customersData: Customer[] = customerList.map(customer => {
            const records = recordsByCustomer.get(customer.id) || [];
            const totalBilled = records
              .filter(r => r.status === 'Paid' || r.status === 'Owed')
              .reduce((sum, r) => sum + r.total, 0);

            return {
                ...customer,
                records,
                totalJobs: records.length,
                totalBilled,
            };
        });
        
        setCustomers(customersData.sort((a,b) => b.totalJobs - a.totalJobs));

      } catch (error) {
        console.error("Failed to fetch customer data:", error);
        // Optionally, set an error state to show in the UI
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch data if the user is loaded and authenticated
    if (!isUserLoading && user) {
        fetchCustomersAndRecords();
    } else if (!isUserLoading && !user) {
        // Handle the case where there is no user after loading
        setIsLoading(false);
        setCustomers([]); // Clear any old data
    }

  }, [firestore, user, isUserLoading]);


  if (isLoading || isUserLoading) {
    return <div>Loading customers...</div>
  }

  return <CustomersClient customers={customers} />;
}
