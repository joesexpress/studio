
'use client';

import TimeClockClient from '@/components/time-clock/TimeClockClient';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { TimeLog, Technician } from '@/lib/types';
import { MOCK_TECHNICIANS } from '@/lib/mock-data';
import { useState, useEffect } from 'react';

export default function TimeClockPage() {
  const { firestore } = useFirebase();
  const [allTimeLogs, setAllTimeLogs] = useState<TimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // For now, we will use mock technicians, but fetch all time logs
  const technicians = MOCK_TECHNICIANS;

  useEffect(() => {
    const fetchAllLogs = async () => {
        if(!firestore) return;
        setIsLoading(true);
        const timeLogPromises = technicians.map(tech => {
            const logsRef = collection(firestore, 'technicians', tech.id, 'timeLogs');
            const logsQuery = query(logsRef, orderBy('timeIn', 'desc'));
            return useCollection<TimeLog>(useMemoFirebase(() => logsQuery, [logsQuery]));
        });

        // This approach is a bit complex for a simple page load. Let's simplify.
        // We'll just fetch all time logs for all known technicians for now.
        const logs: TimeLog[] = [];
        for (const tech of technicians) {
            const logsRef = collection(firestore, 'technicians', tech.id, 'timeLogs');
            const snapshot = await require('firebase/firestore').getDocs(logsRef);
            snapshot.forEach((doc: any) => {
                logs.push({ id: doc.id, ...doc.data() } as TimeLog);
            });
        }
        setAllTimeLogs(logs);
        setIsLoading(false);
    }
    
    // fetchAllLogs is not ideal as it uses getDocs which is not real-time.
    // A better approach for a real app would be to listen to all collections, but that's complex.
    // For now, let's just fetch all logs for all technicians once.
    // The component itself will filter by the selected technician.
    const fetchLogs = async () => {
        if (!firestore) return;
        setIsLoading(true);
        const logs: TimeLog[] = [];
        const techIds = MOCK_TECHNICIANS.map(t => t.id);
        
        for (const id of techIds) {
            const logsRef = collection(firestore, 'technicians', id, 'timeLogs');
            const snapshot = await require('firebase/firestore').getDocs(logsRef);
            snapshot.forEach((doc: any) => logs.push({ id: doc.id, ...doc.data() } as TimeLog));
        }
        setAllTimeLogs(logs);
        setIsLoading(false);
    };

    fetchLogs();

  }, [firestore]);
  
  if (isLoading) {
    return <div>Loading time clock...</div>
  }


  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Clock</h1>
          <p className="text-muted-foreground">Clock in and out for your shifts.</p>
        </div>
      </div>
      <TimeClockClient initialTimeLogs={allTimeLogs} technicians={technicians} />
    </>
  );
}
