'use client';

import * as React from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { ServiceRecord, ServiceRecordStatus } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RecordDetailsSheet from '@/components/records/RecordDetailsSheet';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function InvoicesPage() {
  const { firestore, user } = useFirebase();
  const [selectedRecord, setSelectedRecord] = React.useState<ServiceRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  const invoicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'technicians', user.uid, 'serviceRecords'),
      where('status', '==', 'Owed'),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: invoices, isLoading } = useCollection<ServiceRecord>(invoicesQuery);
  
  const handleViewDetails = (record: ServiceRecord) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  const getRecordDate = (record: ServiceRecord) => {
    if (!record.date) return 'N/A';
    const date = (record.date as any).toDate();
    return format(date, 'P');
  };

  const totalOwed = React.useMemo(() => {
    if (!invoices) return 0;
    return invoices.reduce((sum, record) => sum + record.total, 0);
  }, [invoices]);

  if (isLoading) {
    return <div>Loading outstanding invoices...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outstanding Invoices</h1>
          <p className="text-muted-foreground">A list of all unpaid service records.</p>
        </div>
         <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Owed</p>
          <p className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalOwed)}</p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Amount Owed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices && invoices.length > 0 ? invoices.map(record => (
                <TableRow key={record.id}>
                  <TableCell>{getRecordDate(record)}</TableCell>
                  <TableCell>{record.customer}</TableCell>
                  <TableCell>{record.technician}</TableCell>
                   <TableCell>{record.address}</TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(record.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(record)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No outstanding invoices. Great job!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <RecordDetailsSheet
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        record={selectedRecord}
      />
    </>
  );
}
