'use client';

import * as React from 'react';
import type { Customer, ServiceRecord, ServiceRecordStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import RecordDetailsSheet from '../records/RecordDetailsSheet';
import { Button } from '../ui/button';
import { format } from 'date-fns';

const getStatusVariant = (status: ServiceRecordStatus) => {
    switch (status) {
      case 'Paid':
        return 'secondary';
      case 'Owed':
        return 'destructive';
      case 'Estimate':
        return 'default';
      default:
        return 'outline';
    }
  };

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(customers[0] || null);
  const [selectedRecord, setSelectedRecord] = React.useState<ServiceRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!selectedCustomer && customers.length > 0) {
        setSelectedCustomer(customers[0]);
    }
  }, [customers, selectedCustomer]);

  const handleViewRecordDetails = (record: ServiceRecord) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  const getRecordDate = (record: ServiceRecord) => {
    if (!record.date) return 'N/A';
    const date = typeof record.date === 'string' ? new Date(record.date) : (record.date as any).toDate();
    return format(date, 'P');
  }
  
  return (
    <>
    <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">View customer information and job history.</p>
        </div>
      </div>
    <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="flex flex-col">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`p-4 text-left border-b hover:bg-accent/50 ${selectedCustomer?.id === customer.id ? 'bg-accent' : ''}`}
                >
                  <p className="font-semibold">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.totalJobs} jobs</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        {selectedCustomer ? (
          <>
            <CardHeader>
              <CardTitle>{selectedCustomer.name}</CardTitle>
              <CardDescription>
                {selectedCustomer.address} &bull; {selectedCustomer.phone}
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                        <p className="text-muted-foreground">Total Jobs</p>
                        <p className="font-semibold text-lg">{selectedCustomer.totalJobs}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Total Billed</p>
                        <p className="font-semibold text-lg">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedCustomer.totalBilled)}</p>
                    </div>
                </div>

              <h3 className="font-semibold mb-2">Job History</h3>
              <ScrollArea className="h-[calc(100vh-25rem)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Technician</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCustomer.records.sort((a,b) => {
                        const dateA = a.date ? (typeof a.date === 'string' ? new Date(a.date) : (a.date as any).toDate()).getTime() : 0;
                        const dateB = b.date ? (typeof b.date === 'string' ? new Date(b.date) : (b.date as any).toDate()).getTime() : 0;
                        return dateB - dateA;
                    }).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{getRecordDate(record)}</TableCell>
                        <TableCell>{record.technician}</TableCell>
                        <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(record.total)}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(record.status)} className="capitalize">
                                {record.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="sm" onClick={() => handleViewRecordDetails(record)}>
                             View
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </>
        ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a customer to see their details.</p>
            </div>
        )}
      </Card>
    </div>
    <RecordDetailsSheet
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        record={selectedRecord}
      />
    </>
  );
}
