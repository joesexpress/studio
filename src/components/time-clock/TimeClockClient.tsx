
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { TimeLog } from '@/lib/types';
import { format, differenceInMinutes, formatDistanceStrict } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, LogIn, LogOut } from 'lucide-react';

export default function TimeClockClient({ initialTimeLogs }: { initialTimeLogs: TimeLog[] }) {
  const [timeLogs, setTimeLogs] = React.useState(initialTimeLogs);
  const [activeLog, setActiveLog] = React.useState<Partial<TimeLog> | null>(null);
  const [notes, setNotes] = React.useState('');
  const [currentTime, setCurrentTime] = React.useState(new Date());

  const { toast } = useToast();
  
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = () => {
    const newLog = {
      id: `log-${Date.now()}`,
      timeIn: new Date(),
    };
    setActiveLog(newLog);
    toast({
      title: 'Clocked In',
      description: `Your shift started at ${format(newLog.timeIn, 'p')}`,
    });
  };

  const handleClockOut = () => {
    if (!activeLog || !activeLog.timeIn) return;

    const timeOut = new Date();
    const totalMinutes = differenceInMinutes(timeOut, activeLog.timeIn as Date);
    const totalHours = totalMinutes / 60;

    const completedLog: TimeLog = {
      ...activeLog,
      timeOut,
      notes,
      totalHours,
      technicianId: 'tech-jake', // Replace with actual user later
    } as TimeLog;

    setTimeLogs(prev => [completedLog, ...prev]);
    setActiveLog(null);
    setNotes('');
    toast({
      title: 'Clocked Out',
      description: `Your shift has ended. Total time: ${totalHours.toFixed(2)} hours.`,
    });
  };

  const getFormattedDate = (date: any) => {
    if (!date) return 'N/A';
    const d = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
    return format(d, 'p');
  }

  const currentStatus = activeLog ? `Clocked in since ${format(activeLog.timeIn as Date, 'p')}` : 'Currently clocked out';

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clock In / Out</CardTitle>
          <div className="text-sm text-muted-foreground font-mono">{format(currentTime, 'PPP p')}</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted flex items-center justify-center text-center">
            <div>
              <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-semibold">{currentStatus}</p>
              {activeLog?.timeIn && (
                 <p className="text-sm text-muted-foreground">
                    Duration so far: {formatDistanceStrict(new Date(), activeLog.timeIn as Date)}
                </p>
              )}
            </div>
          </div>

          {!activeLog ? (
            <Button onClick={handleClockIn} className="w-full" size="lg">
              <LogIn className="mr-2 h-4 w-4" /> Clock In
            </Button>
          ) : (
            <div className="space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes for your shift..."
                rows={3}
              />
              <Button onClick={handleClockOut} className="w-full" size="lg" variant="destructive">
                <LogOut className="mr-2 h-4 w-4" /> Clock Out
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Today's Entries</CardTitle>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time In</TableHead>
                <TableHead>Time Out</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Total Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeLogs.length > 0 ? (
                timeLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{getFormattedDate(log.timeIn)}</TableCell>
                    <TableCell>{getFormattedDate(log.timeOut)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{log.notes || 'N/A'}</TableCell>
                    <TableCell className="text-right font-medium">{(log.totalHours || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No time entries for today.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
