
'use client';

import type { Customer, ServiceRecord } from '@/lib/types';
import CustomersClient from '@/components/customers/CustomersClient';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
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
        const customersColRef = collection(firestore, 'customers');
        const customerSnapshot = await getDocs(customersColRef);
        
        const customersData: Customer[] = [];

        for (const customerDoc of customerSnapshot.docs) {
            const customer = { id: customerDoc.id, ...customerDoc.data() } as Omit<Customer, 'records'|'totalJobs'|'totalBilled'>;
            
            const recordsColRef = collection(firestore, 'customers', customerDoc.id, 'serviceRecords');
            const recordsQuery = query(recordsColRef, orderBy('date', 'desc'));
            const recordsSnapshot = await getDocs(recordsQuery);
            
            const records = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord));
            
            const totalBilled = records
              .filter(r => r.status === 'Paid' || r.status === 'Owed')
              .reduce((sum, r) => sum + r.total, 0);

            customersData.push({
                ...customer,
                records,
                totalJobs: records.length,
                totalBilled,
            });
        }
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
    }

  }, [firestore, user, isUserLoading]);


  if (isLoading || isUserLoading) {
    return <div>Loading customers...</div>
  }

  return <CustomersClient customers={customers} />;
}
