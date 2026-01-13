
'use client';

import type { Customer, ServiceRecord } from '@/lib/types';
import CustomersClient from '@/components/customers/CustomersClient';
import { useFirebase, useUser } from '@/firebase';
import { collection, getDocs, query, collectionGroup } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function CustomersPage() {
  const { firestore } = useFirebase();
  const { user, isAuthReady } = useUser();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomersAndRecords = async () => {
      if (!firestore || !user) return;
      setIsLoading(true);
      try {
        // 1. Fetch all customers and all service records concurrently
        const customersQuery = query(collection(firestore, 'customers'));
        const recordsQuery = query(collectionGroup(firestore, 'serviceRecords'));

        const [customerSnapshot, recordsSnapshot] = await Promise.all([
          getDocs(customersQuery),
          getDocs(recordsQuery),
        ]);

        const customerList = customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
        const allRecords = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord));
        
        // 2. Create a map of customers by their ID for efficient lookup
        const customerMap = new Map<string, Customer>(customerList.map(c => [c.id, { ...c, records: [], totalJobs: 0, totalBilled: 0 }]));

        // 3. Associate records with their customers
        allRecords.forEach(record => {
            const customer = customerMap.get(record.customerId);
            if (customer) {
                customer.records.push(record);
            }
        });

        // 4. Calculate totalJobs and totalBilled for each customer
        customerMap.forEach(customer => {
            customer.totalJobs = customer.records.length;
            customer.totalBilled = customer.records
                .filter(r => r.status === 'Paid' || r.status === 'Owed')
                .reduce((sum, r) => sum + (r.total || 0), 0);
        });
        
        // 5. Convert map back to an array and sort
        const customersWithData = Array.from(customerMap.values());
        setCustomers(customersWithData.sort((a,b) => b.totalJobs - a.totalJobs));

      } catch (error) {
        console.error("Failed to fetch customer data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthReady && user) {
        fetchCustomersAndRecords();
    } else if (isAuthReady) {
      // Handle the case where there is no user, but auth is ready
      setIsLoading(false);
    }
  }, [firestore, user, isAuthReady]);


  if (isLoading || !isAuthReady) {
    return <div>Loading customers...</div>
  }

  return <CustomersClient customers={customers} />;
}
