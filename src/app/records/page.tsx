
'use client';
import { useState, useEffect } from 'react';
import RecordsPageClient from '@/components/records/RecordsPageClient';
import { useFirebase, useUser } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import type { ServiceRecord, Customer } from '@/lib/types';

export default function RecordsPage() {
  const { firestore, isAuthReady } = useUser();
  const [initialRecords, setInitialRecords] = useState<ServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllRecords = async () => {
      if (!firestore) return;
      setIsLoading(true);
      try {
        // 1. Fetch all customers
        const customersQuery = query(collection(firestore, 'customers'));
        const customersSnapshot = await getDocs(customersQuery);
        const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));

        // 2. Fetch all service records from each customer's subcollection
        const allRecords: ServiceRecord[] = [];
        for (const customer of customers) {
            const recordsRef = collection(firestore, 'customers', customer.id, 'serviceRecords');
            const recordsSnapshot = await getDocs(recordsRef);
            recordsSnapshot.forEach(doc => {
                allRecords.push({ id: doc.id, ...doc.data() } as ServiceRecord);
            });
        }
        setInitialRecords(allRecords);

      } catch (error) {
        console.error("Failed to fetch records:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthReady) {
      fetchAllRecords();
    }
  }, [firestore, isAuthReady]);


  if (isLoading) {
    return <div>Loading records...</div>;
  }

  return <RecordsPageClient initialRecords={initialRecords || []} />;
}
