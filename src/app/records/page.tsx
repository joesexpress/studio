
'use client';
import RecordsPageClient from '@/components/records/RecordsPageClient';
import { MOCK_RECORDS } from '@/lib/mock-data';

export default function RecordsPage() {
  // Using mock data instead of Firestore
  const initialRecords = MOCK_RECORDS;

  return <RecordsPageClient initialRecords={initialRecords || []} />;
}
