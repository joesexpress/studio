
'use client';

import TimeClockClient from '@/components/time-clock/TimeClockClient';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { TimeLog } from '@/lib/types';
import { MOCK_TECHNICIANS } from '@/lib/mock-data';
import { useState, useEffect } from 'react';

export default function TimeClockPage() {
  const { firestore } = useFirebase();
  const [allTimeLogs, setAllTimeLogs] = useState<TimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // For now, we will use mock technicians
  const technicians = MOCK_TECHNICIANS;

  useEffect(() => {
    const fetchLogs = async () => {
        if (!firestore) return;
        setIsLoading(true);
        const logs: TimeLog[] = [];
        const techIds = MOCK_TECHNICIANS.map(t => t.id);
        
        // This is not ideal for real-time, but for this app it's fine for page load.
        // A better approach might be a collection group query if rules allow.
        for (const id of techIds) {
            const logsRef = collection(firestore, 'technicians', id, 'timeLogs');
            try {
              const snapshot = await getDocs(logsRef);
              snapshot.forEach((doc: any) => logs.push({ id: doc.id, ...doc.data() } as TimeLog));
            } catch(e) {
              // This can happen if the subcollection doesn't exist yet, which is fine.
              console.log(`No timeLogs for technician ${id} or permission error.`);
            }
        }
        setAllTimeLogs(logs.sort((a,b) => (b.timeIn as any).toDate() - (a.timeIn as any).toDate()));
        setIsLoading(false);
    };

    fetchLogs();

  }, [firestore]);
  
  if (isLoading) {
    return <div>Loading time clock...</div>
  }

  return (
    <>
      <TimeClockClient initialTimeLogs={allTimeLogs} technicians={technicians} />
    </>
  );
}
