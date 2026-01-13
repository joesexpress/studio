
'use client';

import TimeClockClient from '@/components/time-clock/TimeClockClient';
import { MOCK_TIME_LOGS, MOCK_TECHNICIANS } from '@/lib/mock-data';

export default function TimeClockPage() {

  const technicians = MOCK_TECHNICIANS;
  const timeLogs = MOCK_TIME_LOGS;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Clock</h1>
          <p className="text-muted-foreground">Clock in and out for your shifts.</p>
        </div>
      </div>
      <TimeClockClient initialTimeLogs={timeLogs} technicians={technicians} />
    </>
  );
}
