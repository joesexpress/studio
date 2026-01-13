
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
import { Edit, MapPin, Phone, PlusCircle, Download } from 'lucide-react';
import EditCustomerDialog from './EditCustomerDialog';
import { setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import AddCustomerDialog from './AddCustomerDialog';
import { downloadCsv } from '@/lib/utils';

const getStatusVariant = (status: ServiceRecordStatus) => {
    switch (status) {
      case 'Paid':
        return 'secondary';
      case 'Completed':
        return 'secondary';
      case 'Scheduled':
        return 'default';
      case 'Owed':
        return 'destructive';
      case 'Estimate':
        return 'outline';
      default:
        return 'outline';
    }
  };

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(customers[0] || null);
  const [selectedRecord, setSelectedRecord] = React.useState<ServiceRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = React.useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = React.useState(false);

  const { firestore } = useFirebase();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!selectedCustomer && customers.length > 0) {
        setSelectedCustomer(customers[0]);
    } else if (selectedCustomer) {
      // Update selected customer with fresh data from the list
      const freshCustomer = customers.find(c => c.id === selectedCustomer.id);
      if (freshCustomer) {
        setSelectedCustomer(freshCustomer);
      }
    }
  }, [customers, selectedCustomer]);

  const handleViewRecordDetails = (record: ServiceRecord) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  const handleUpdateCustomer = (updatedCustomer: Partial<Customer>) => {
    if (!firestore || !selectedCustomer) return;
    const customerRef = doc(firestore, 'customers', selectedCustomer.id);
    
    const customerDataToUpdate = {
        name: updatedCustomer.name || selectedCustomer.name,
        address: updatedCustomer.address || selectedCustomer.address,
        phone: updatedCustomer.phone || selectedCustomer.phone,
    };

    setDocumentNonBlocking(customerRef, customerDataToUpdate, { merge: true });

    toast({
        title: 'Customer Updated',
        description: 'The customer details have been saved.',
    });
  }

  const handleRecordUpdate = (updatedRecord: ServiceRecord) => {
     // This is a bit of a trick to force a re-render with fresh data.
     // In a more complex app, you might use a state management library.
     const updatedCustomers = customers.map(c => {
       if (c.id === updatedRecord.customerId) {
         const newRecords = c.records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
         return {...c, records: newRecords};
       }
       return c;
     });
     // This won't work directly as customers is a prop.
     // The parent component (`customers/page.tsx`) will get fresh data from Firestore automatically.
  }

  const getRecordDate = (record: ServiceRecord) => {
    if (!record.date) return 'N/A';
    const date = typeof record.date === 'string' ? new Date(record.date) : (record.date as any).toDate();
    return format(date, 'P');
  }

  const handleDownloadReport = () => {
    const dataToExport = customers.map(c => ({
      Name: c.name,
      Address: c.address,
      Phone: c.phone,
      'Total Jobs': c.totalJobs,
      'Total Billed': c.totalBilled,
    }));
    downloadCsv(dataToExport, `customers-report-${new Date().toISOString().split('T')[0]}.csv`);
  }
  
  return (
    <>
    <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">View customer information and job history.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                <Download className="mr-2 h-4 w-4" />
                Download Report
            </Button>
            <Button size="sm" onClick={() => setIsAddCustomerOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Customer & Job
            </Button>
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
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>{selectedCustomer.name}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCustomer.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                                <MapPin className="h-4 w-4" /> {selectedCustomer.address}
                            </a>
                            <a href={`tel:${selectedCustomer.phone}`} className="flex items-center gap-2 hover:underline">
                                <Phone className="h-4 w-4" /> {selectedCustomer.phone}
                            </a>
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsEditCustomerOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                </div>
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
        onRecordUpdated={handleRecordUpdate}
      />
    <EditCustomerDialog
        isOpen={isEditCustomerOpen}
        onOpenChange={setIsEditCustomerOpen}
        customer={selectedCustomer}
        onSave={handleUpdateCustomer}
    />
    <AddCustomerDialog
        isOpen={isAddCustomerOpen}
        onOpenChange={setIsAddCustomerOpen}
    />
    </>
  );
}
