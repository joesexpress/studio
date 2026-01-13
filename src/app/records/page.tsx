
'use client';
import RecordsPageClient from '@/components/records/RecordsPageClient';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

export default function RecordsPage() {
  const { firestore, user } = useFirebase();

  const serviceRecordsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Query to get all service records for the current technician
    return query(
        collection(firestore, 'technicians', user.uid, 'serviceRecords'),
        orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: initialRecords, isLoading } = useCollection(serviceRecordsQuery);

  if (isLoading) {
    // You can return a loading spinner here
    return <div>Loading records...</div>;
  }

  return <RecordsPageClient initialRecords={initialRecords || []} />;
}
