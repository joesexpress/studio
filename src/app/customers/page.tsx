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
        // 1. Fetch all customers
        const customersQuery = query(collection(firestore, 'customers'));
        const customerSnapshot = await getDocs(customersQuery);
        const customerList = customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));

        // 2. Fetch all service records for each customer
        const customersWithData = await Promise.all(customerList.map(async (customer) => {
            const recordsRef = collection(firestore, 'customers', customer.id, 'serviceRecords');
            const recordsSnapshot = await getDocs(recordsRef);
            const records = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord));
            
            const totalJobs = records.length;
            const totalBilled = records
                .filter(r => r.status === 'Paid' || r.status === 'Owed')
                .reduce((sum, r) => sum + (r.total || 0), 0);

            return {
                ...customer,
                records,
                totalJobs,
                totalBilled
            };
        }));
        
        // 3. Sort and set the final state
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
