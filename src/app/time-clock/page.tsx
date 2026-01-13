
'use client';

import TimeClockClient from '@/components/time-clock/TimeClockClient';
import { useFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { TimeLog } from '@/lib/types';
import { MOCK_TECHNICIANS } from '@/lib/mock-data';
import { useState, useEffect } from 'react';

export default function TimeClockPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading: isAuthLoading } = useUser();
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
              const snapshot = await getDocs(logsRef);
              snapshot.forEach((doc: any) => logs.push({ id: doc.id, ...doc.data() } as TimeLog));
          }
          setAllTimeLogs(logs.sort((a,b) => {
            const timeA = a.timeIn ? (a.timeIn as any).toDate().getTime() : 0;
            const timeB = b.timeIn ? (b.timeIn as any).toDate().getTime() : 0;
            return timeB - timeA;
          }));
        } catch(e) {
            console.error("Error fetching time logs:", e);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthLoading && user) {
        fetchLogs();
    } else if (!isAuthLoading && !user) {
        setIsLoading(false);
    }

  }, [firestore, user, isAuthLoading]);
  
  if (isLoading || isAuthLoading) {
    return <div>Loading time clock...</div>
  }

  return (
    <>
      <TimeClockClient initialTimeLogs={allTimeLogs} technicians={technicians} />
    </>
  );
}
