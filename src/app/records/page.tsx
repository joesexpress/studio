'use client';
import RecordsPageClient from '@/components/records/RecordsPageClient';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import type { ServiceRecord } from '@/lib/types';
import { collection, query, orderBy } from 'firebase/firestore';

export default function RecordsPage() {
  const { firestore, user } = useFirebase();

  const serviceRecordsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'technicians', user.uid, 'serviceRecords'),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: initialRecords, isLoading } = useCollection<ServiceRecord>(serviceRecordsQuery);
  
  if (isLoading) {
    return <div>Loading records...</div>
  }

  return <RecordsPageClient initialRecords={initialRecords || []} />;
}
