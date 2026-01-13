
'use client';

import { useEffect, useState } from 'react';
import type { Customer, ServiceRecord } from '@/lib/types';
import CustomersClient from '@/components/customers/CustomersClient';
import { useFirebase, useUser } from '@/firebase';
import { collection, getDocs, query, collectionGroup } from 'firebase/firestore';

export default function CustomersPage() {
  const { firestore, isAuthReady } = useFirebase();
  const [allRecords, setAllRecords] = useState<ServiceRecord[]>([]);
  const [allCustomers, setAllCustomers] = useState<Omit<Customer, 'records'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!firestore || !isAuthReady) return;

      setIsLoading(true);
      try {
        // Fetch all customers
        const custQuery = query(collection(firestore, 'customers'));
        const custSnapshot = await getDocs(custQuery);
        const customersList = custSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Omit<Customer, 'records'>));
        setAllCustomers(customersList);
        
        // Fetch all service records
        const recordsQuery = query(collectionGroup(firestore, 'serviceRecords'));
        const recordsSnapshot = await getDocs(recordsQuery);
        const recordsList = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord));
        setAllRecords(recordsList);

      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllData();

  }, [firestore, isAuthReady]);


  if (isLoading) {
    return <div>Loading jobs...</div>
  }

  return <CustomersClient allRecords={allRecords} allCustomers={allCustomers} />;
}
