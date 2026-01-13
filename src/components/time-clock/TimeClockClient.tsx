
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { TimeLog, Technician } from '@/lib/types';
import { format, differenceInMinutes, formatDistanceStrict, isWithinInterval } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';


export default function TimeClockClient({ initialTimeLogs, technicians }: { initialTimeLogs: TimeLog[], technicians: Technician[] }) {
  const [timeLogs, setTimeLogs] = React.useState(initialTimeLogs);
  const [activeLog, setActiveLog] = React.useState<Partial<TimeLog> | null>(null);
  const [notes, setNotes] = React.useState('');
  const [currentTime, setCurrentTime] = React.useState<Date | null>(null);
  const [selectedTechnician, setSelectedTechnician] = React.useState<string>(technicians[0]?.id || '');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

  const { toast } = useToast();
  
  React.useEffect(() => {
    // Set current time only on the client
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = () => {
    if (!selectedTechnician) {
      toast({ title: 'Please select a technician first.', variant: 'destructive'});
      return;
    }
    const newLog = {
      id: `log-${Date.now()}`,
      timeIn: new Date(),
      technicianId: selectedTechnician,
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
      technicianId: selectedTechnician,
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

  const filteredLogs = React.useMemo(() => {
    return timeLogs.filter(log => {
      const techMatch = log.technicianId === selectedTechnician;
      if (!dateRange?.from || !techMatch) return techMatch;
      const logDate = typeof log.timeIn.toDate === 'function' ? log.timeIn.toDate() : new Date(log.timeIn as any);
      return isWithinInterval(logDate, { start: dateRange.from, end: dateRange.to || dateRange.from });
    });
  }, [timeLogs, selectedTechnician, dateRange]);

  const totalHours = React.useMemo(() => {
    return filteredLogs.reduce((acc, log) => acc + (log.totalHours || 0), 0);
  }, [filteredLogs]);


  const currentActiveTechnician = technicians.find(t => t.id === activeLog?.technicianId);
  const currentStatus = activeLog ? `Clocked in since ${format(activeLog.timeIn as Date, 'p')}` : 'Currently clocked out';
  const selectedTechName = technicians.find(t => t.id === selectedTechnician)?.name || 'Select Technician';

  return (
    <>
    <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Clock</h1>
          <p className="text-muted-foreground">Clock in and out for your shifts.</p>
        </div>
        <div className="flex items-center gap-4">
            <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Technician" />
                </SelectTrigger>
                <SelectContent>
                    {technicians.map(tech => (
                        <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
        </div>
      </div>
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clock In / Out</CardTitle>
          <div className="text-sm text-muted-foreground font-mono">{currentTime ? format(currentTime, 'PPP p') : ''}</div>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="p-4 rounded-lg bg-muted flex items-center justify-center text-center h-28">
            <div>
              <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-semibold">{currentActiveTechnician ? `${currentActiveTechnician.name} is clocked in` : 'Clocked Out'}</p>
              {activeLog?.timeIn && (
                 <p className="text-sm text-muted-foreground">
                    Shift duration: {formatDistanceStrict(new Date(), activeLog.timeIn as Date)}
                </p>
              )}
            </div>
          </div>

          {!activeLog ? (
            <Button onClick={handleClockIn} className="w-full" size="lg" disabled={!selectedTechnician}>
              <LogIn className="mr-2 h-4 w-4" /> Clock In as {selectedTechName}
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
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{selectedTechName}'s Entries</CardTitle>
           <div className="text-sm text-muted-foreground">
            Total Hours for selected period: <span className="font-bold text-primary">{totalHours.toFixed(2)}</span>
          </div>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time In</TableHead>
                <TableHead>Time Out</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Total Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(log.timeIn.toDate ? log.timeIn.toDate() : new Date(log.timeIn as any), 'PP')}</TableCell>
                    <TableCell>{getFormattedDate(log.timeIn)}</TableCell>
                    <TableCell>{getFormattedDate(log.timeOut)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{log.notes || 'N/A'}</TableCell>
                    <TableCell className="text-right font-medium">{(log.totalHours || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No time entries for this period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
