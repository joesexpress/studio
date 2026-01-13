
'use client';

import * as React from 'react';
import type { ServiceRecord } from '@/lib/types';
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
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collectionGroup, query, where } from 'firebase/firestore';
import { Download } from 'lucide-react';
import { downloadCsv } from '@/lib/utils';

export default function InvoicesPage() {
  const [selectedRecord, setSelectedRecord] = React.useState<ServiceRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  const { firestore, user, isUserLoading } = useFirebase();

  const invoicesQuery = useMemoFirebase(() => {
    // Wait until firestore and user are available before creating the query.
    if (!firestore || !user) return null;
    
    return query(
      collectionGroup(firestore, 'serviceRecords'),
      where('status', '==', 'Owed')
    );
  }, [firestore, user]);

  const { data: invoices, isLoading: isInvoicesLoading } = useCollection<ServiceRecord>(invoicesQuery);

  const handleViewDetails = (record: ServiceRecord) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  const getRecordDate = (record: ServiceRecord) => {
    if (!record.date) return 'N/A';
    const date = typeof record.date === 'string' ? new Date(record.date) : (record.date as any).toDate();
    return format(date, 'P');
  };

  const totalOwed = React.useMemo(() => {
    if (!invoices) return 0;
    return invoices.reduce((sum, record) => sum + record.total, 0);
  }, [invoices]);

  const handleDownloadReport = () => {
    if (!invoices) return;
    const dataToExport = invoices.map(r => ({
      Date: getRecordDate(r),
      Customer: r.customer,
      Technician: r.technician,
      Address: r.address,
      'Amount Owed': r.total,
      'Payment Method': r.paymentMethod || 'N/A',
    }));
    downloadCsv(dataToExport, `accounts-receivable-report-${new Date().toISOString().split('T')[0]}.csv`);
  }
  
  const isLoading = isUserLoading || isInvoicesLoading;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts Receivable</h1>
          <p className="text-muted-foreground">A list of all unpaid service records.</p>
        </div>
         <div className='flex items-center gap-4'>
             <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Owed</p>
              <p className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalOwed)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                <Download className="mr-2 h-4 w-4" />
                Download Report
            </Button>
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
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading invoices...
                  </TableCell>
                </TableRow>
              ) : invoices && invoices.length > 0 ? invoices.map(record => (
                <TableRow key={record.id}>
                  <TableCell>{getRecordDate(record)}</TableCell>
                  <TableCell>{record.customer}</TableCell>
                  <TableCell>{record.technician}</TableCell>
                   <TableCell>{record.address}</TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(record.total)}
                  </TableCell>
                  <TableCell>{record.paymentMethod || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(record)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
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
