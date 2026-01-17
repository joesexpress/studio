
'use client';

import * as React from 'react';
import type { Expense } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format, isWithinInterval } from 'date-fns';
import { PlusCircle, Download, CalendarIcon } from 'lucide-react';
import UploadExpenseDialog from '@/components/expenses/UploadExpenseDialog';
import { useFirebase, useUser } from '@/firebase';
import { collectionGroup, getDocs, query } from 'firebase/firestore';
import { MOCK_TECHNICIANS } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, safeToDate, downloadCsv } from '@/lib/utils';

export default function ExpensesPage() {
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const { firestore } = useFirebase();
  const { user, isAuthReady } = useUser();
  const [allExpenses, setAllExpenses] = React.useState<Expense[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [filters, setFilters] = React.useState<{
    technicianId: string;
    dateRange: DateRange | undefined;
  }>({
    technicianId: 'all',
    dateRange: undefined,
  });

  React.useEffect(() => {
    const fetchAllExpenses = async () => {
        if (!firestore || !user) return;
        setIsLoading(true);
        try {
            const expensesQuery = query(collectionGroup(firestore, 'expenses'));
            const expensesSnapshot = await getDocs(expensesQuery);
            const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
            setAllExpenses(expenses);
        } catch (error) {
            console.error("Failed to fetch expenses:", error);
        } finally {
            setIsLoading(false);
        }
    }

    if (isAuthReady) {
      fetchAllExpenses();
    }
  }, [firestore, user, isAuthReady]);


  const filteredExpenses = React.useMemo(() => {
    return allExpenses.filter(expense => {
      const techMatch = filters.technicianId === 'all' || expense.technicianId === filters.technicianId;
      
      const expenseDate = safeToDate(expense.date);
      if (!expenseDate) return false;

      const dateMatch = !filters.dateRange?.from || !filters.dateRange?.to || isWithinInterval(expenseDate, { start: filters.dateRange.from, end: filters.dateRange.to });

      return techMatch && dateMatch;
    }).sort((a,b) => {
        const dateA = safeToDate(a.date);
        const dateB = safeToDate(b.date);
        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });
  }, [allExpenses, filters]);


  const getEntryDate = (entry: Expense) => {
    const date = safeToDate(entry.date);
    if (!date) return 'N/A';
    return format(date, 'PPP');
  };
  
  const totalExpenses = React.useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  const handleTechnicianChange = (techId: string) => {
    setFilters(prev => ({...prev, technicianId: techId}));
  }

  const handleDateChange = (dateRange: DateRange | undefined) => {
    setFilters(prev => ({...prev, dateRange}));
  }

  const handleDownloadReport = () => {
    const dataToExport = filteredExpenses.map(e => {
        const techName = MOCK_TECHNICIANS.find(t => t.id === e.technicianId)?.name || 'N/A';
        return {
            Date: getEntryDate(e),
            Vendor: e.vendor,
            Description: e.description,
            Technician: techName,
            Amount: e.amount,
            'Receipt URL': e.receiptUrl,
        }
    });
    downloadCsv(dataToExport, `expenses-report-${new Date().toISOString().split('T')[0]}.csv`);
  }
  
  if (isLoading || !isAuthReady) {
    return <div>Loading expenses...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track your job-related expenses and receipts.
          </p>
        </div>
        <div className='flex items-center gap-2'>
            <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Displayed</p>
                <p className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalExpenses)}</p>
            </div>
             <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                <Download className="mr-2 h-4 w-4" />
                Download Report
            </Button>
            <Button size="sm" onClick={() => setIsUploadOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Expense
            </Button>
        </div>
      </div>
      
      <Card className="p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <Select value={filters.technicianId} onValueChange={handleTechnicianChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Technicians" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Technicians</SelectItem>
            {MOCK_TECHNICIANS.filter(t => !['tbd', 'fcfs'].includes(t.id)).map(tech => (
              <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !filters.dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange?.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, "LLL dd, y")} -{' '}
                    {format(filters.dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(filters.dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={filters.dateRange?.from}
              selected={filters.dateRange}
              onSelect={handleDateChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => {
                    const techName = MOCK_TECHNICIANS.find(t => t.id === expense.technicianId)?.name || 'N/A';
                    return (
                        <TableRow key={expense.id}>
                            <TableCell>{getEntryDate(expense)}</TableCell>
                            <TableCell className="font-medium">{expense.vendor}</TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>{techName}</TableCell>
                            <TableCell className="text-right font-medium">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(expense.amount)}
                            </TableCell>
                            <TableCell className="text-right">
                            <Button asChild variant="ghost" size="sm">
                                <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                                </a>
                            </Button>
                            </TableCell>
                        </TableRow>
                    )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No expenses found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <UploadExpenseDialog
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
      /> 
    </>
  );
}
