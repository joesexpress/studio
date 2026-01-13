import { serviceRecords } from '@/lib/mock-data';
import RecordsPageClient from '@/components/records/RecordsPageClient';

async function getRecords() {
  // In a real app, this would be a database call
  return serviceRecords;
}

export default async function RecordsPage() {
  const initialRecords = await getRecords();

  return <RecordsPageClient initialRecords={initialRecords} />;
}
