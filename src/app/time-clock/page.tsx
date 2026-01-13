
'use client';

import TimeClockClient from '@/components/time-clock/TimeClockClient';
import { MOCK_TIME_LOGS } from '@/lib/mock-data';

export default function TimeClockPage() {

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Clock</h1>
          <p className="text-muted-foreground">Clock in and out for your shifts.</p>
        </div>
      </div>
      <TimeClockClient initialTimeLogs={MOCK_TIME_LOGS} />
    </>
  );
}
