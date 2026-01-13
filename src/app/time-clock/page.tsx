
'use client';

import TimeClockClient from '@/components/time-clock/TimeClockClient';
import { useFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { TimeLog } from '@/lib/types';
import { MOCK_TECHNICIANS } from '@/lib/mock-data';
import { useState, useEffect } from 'react';

export default function TimeClockPage() {
  const { firestore } = useFirebase();
  const { user, isAuthReady } = useUser();
  const [allTimeLogs, setAllTimeLogs] = useState<TimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // For now, we will use mock technicians
  const technicians = MOCK_TECHNICIANS;

  useEffect(() => {
    const fetchLogs = async () => {
        if (!firestore || !user) return;
        setIsLoading(true);
        const logs: TimeLog[] = [];
        const techIds = MOCK_TECHNICIANS.map(t => t.id);
        
        try {
          for (const id of techIds) {
              if (!id) continue; // Skip if id is invalid
              const logsRef = collection(firestore, 'technicians', id, 'timeLogs');
              const snapshot = await getDocs(query(logsRef, orderBy('timeIn', 'desc')));
              snapshot.forEach((doc: any) => logs.push({ id: doc.id, ...doc.data() } as TimeLog));
          }
          setAllTimeLogs(logs); // Already sorted by query
        } catch(e) {
            console.error("Error fetching time logs:", e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isAuthReady) {
        fetchLogs();
    }
  }, [firestore, user, isAuthReady]);
  
  if (isLoading || !isAuthReady) {
    return <div>Loading time clock...</div>
  }

  return (
    <>
      <TimeClockClient initialTimeLogs={allTimeLogs} technicians={technicians} />
    </>
  );
}
