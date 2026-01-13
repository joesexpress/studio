
'use client';

import type { Customer, ServiceRecord } from '@/lib/types';
import CustomersClient from '@/components/customers/CustomersClient';
import { useFirebase, useUser } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
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
        // 1. Fetch all customers
        const customersQuery = query(collection(firestore, 'customers'));
        const customerSnapshot = await getDocs(customersQuery);
        const customerList = customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
        
        // 2. Fetch all service records for each customer
        const customersWithData = await Promise.all(customerList.map(async (customer) => {
            const recordsRef = collection(firestore, 'customers', customer.id, 'serviceRecords');
            const recordsSnapshot = await getDocs(recordsRef);
            const records = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord));
            
            const totalBilled = records
              .filter(r => r.status === 'Paid' || r.status === 'Owed')
              .reduce((sum, r) => sum + r.total, 0);

            return {
                ...customer,
                records,
                totalJobs: records.length,
                totalBilled,
            };
        }));
        
        setCustomers(customersWithData.sort((a,b) => b.totalJobs - a.totalJobs));

      } catch (error) {
        console.error("Failed to fetch customer data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!isUserLoading && user) {
        fetchCustomersAndRecords();
    } else if (!isUserLoading && !user) {
        setIsLoading(false);
        setCustomers([]);
    }

  }, [firestore, user, isUserLoading]);


  if (isLoading || isUserLoading) {
    return <div>Loading customers...</div>
  }

  return <CustomersClient customers={customers} />;
}
