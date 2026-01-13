
'use client';
import RecordsPageClient from '@/components/records/RecordsPageClient';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

export default function RecordsPage() {
  const { firestore } = useFirebase();

  // Using a mock user ID as login is removed.
  const mockUserId = 'tech-jake';

  const serviceRecordsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query to get all service records for the default technician
    return query(
        collection(firestore, 'technicians', mockUserId, 'serviceRecords'),
        orderBy('date', 'desc')
    );
  }, [firestore]);

  const { data: initialRecords, isLoading } = useCollection(serviceRecordsQuery);

  if (isLoading) {
    // You can return a loading spinner here
    return <div>Loading records...</div>;
  }

  return <RecordsPageClient initialRecords={initialRecords || []} />;
}
