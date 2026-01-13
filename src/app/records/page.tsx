'use client';
import { useState, useEffect } from 'react';
import RecordsPageClient from '@/components/records/RecordsPageClient';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore';
import type { ServiceRecord } from '@/lib/types';

export default function RecordsPage() {
  const { firestore, isAuthReady } = useFirebase();

  // This query will find all documents in any collection named 'serviceRecords'
  // and order them by date. This is the most efficient way to get all jobs.
  const allRecordsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collectionGroup(firestore, 'serviceRecords'),
      orderBy('date', 'desc')
    );
  }, [firestore]);

  // The useCollection hook handles loading, error, and data states for us.
  const { data: initialRecords, isLoading, error } = useCollection<ServiceRecord>(
    allRecordsQuery,
    { skip: !isAuthReady }
  );

  useEffect(() => {
    if (error) {
      console.error("Failed to fetch records:", error);
      // Optionally, show a toast notification for the error
    }
  }, [error]);

  // The isLoading state from the hook will determine if we show the loading message.
  if (isLoading || !isAuthReady) {
    return <div>Loading records...</div>;
  }

  return <RecordsPageClient initialRecords={initialRecords || []} />;
}
