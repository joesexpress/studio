
'use client';
import RecordsPageClient from '@/components/records/RecordsPageClient';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function RecordsPage() {
  const { firestore, user, isUserLoading } = useFirebase();

  // Using a mock user ID as login is removed.
  const mockUserId = 'tech-jake';

  const serviceRecordsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Query to get all service records for the default technician
    return query(
        collection(firestore, 'technicians', mockUserId, 'serviceRecords'),
        orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: initialRecords, isLoading: areRecordsLoading } = useCollection(serviceRecordsQuery);

  const isLoading = isUserLoading || areRecordsLoading;

  if (isLoading) {
    // You can return a loading spinner here
    return <div>Loading records...</div>;
  }

  return <RecordsPageClient initialRecords={initialRecords || []} />;
}
