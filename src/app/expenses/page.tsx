
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
import { format } from 'date-fns';
import { PlusCircle, Download } from 'lucide-react';
import UploadExpenseDialog from '@/components/expenses/UploadExpenseDialog';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';


export default function ExpensesPage() {
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const { firestore, user } = useFirebase();

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'technicians', user.uid, 'expenses'),
        orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery);

  const getEntryDate = (entry: Expense) => {
    if (!entry.date) return 'N/A';
    const date = typeof entry.date === 'string' ? new Date(entry.date) : (entry.date as any).toDate();
    return format(date, 'PPP');
  };
  
  const totalExpenses = React.useMemo(() => {
    if (!expenses) return 0;
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track your job-related expenses and receipts.
          </p>
        </div>
        <div className='flex items-center gap-4'>
            <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalExpenses)}</p>
            </div>
            <Button size="sm" onClick={() => setIsUploadOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Expense
            </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Loading expenses...
                    </TableCell>
                  </TableRow>
              ) : expenses && expenses.length > 0 ? (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{getEntryDate(expense)}</TableCell>
                    <TableCell className="font-medium">{expense.vendor}</TableCell>
                    <TableCell>{expense.description}</TableCell>
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No expenses found.
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
