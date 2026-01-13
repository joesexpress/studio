
'use client';
import RecordsPageClient from '@/components/records/RecordsPageClient';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore';

export default function RecordsPage() {
  const { firestore, user, isUserLoading } = useFirebase();

  const serviceRecordsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Query to get all service records across all technicians
    return query(
        collectionGroup(firestore, 'serviceRecords'),
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
