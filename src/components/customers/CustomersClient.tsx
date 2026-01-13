'use client';

import * as React from 'react';
import type { Customer, ServiceRecord, ServiceRecordStatus } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '../ui/button';
import { Badge } from '@/components/ui/badge';
import RecordDetailsSheet from '../records/RecordDetailsSheet';
import { format, isWithinInterval } from 'date-fns';
import { Download, ListFilter, FileUp, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { MOCK_TECHNICIANS } from '@/lib/mock-data';
import { downloadCsv } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import ImportCsvDialog from '../records/ImportCsvDialog';
import { Checkbox } from '../ui/checkbox';
import { useFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


const getStatusVariant = (status: ServiceRecordStatus) => {
    switch (status) {
      case 'Paid':
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

export default function CustomersClient({ allRecords, allCustomers }: { allRecords: ServiceRecord[], allCustomers: Omit<Customer, 'records'>[] }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedRecord, setSelectedRecord] = React.useState<ServiceRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<{
      technician: string,
      customer: string,
      dateRange: DateRange | undefined,
      status: ServiceRecordStatus[]
  }>({
      technician: '',
      customer: '',
      dateRange: undefined,
      status: []
  });
  
  // When the underlying data changes (e.g., after deletion), we need to clear selected rows
  React.useEffect(() => {
    setSelectedRows([]);
  }, [allRecords]);


  const filteredRecords = React.useMemo(() => {
    return (allRecords || []).filter(record => {
      const searchMatch =
        searchTerm === '' ||
        record.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.technician?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.address?.toLowerCase().includes(searchTerm.toLowerCase());

      const techMatch = !filters.technician || record.technicianId === filters.technician;
      const customerMatch = !filters.customer || record.customerId === filters.customer;
      const statusMatch = filters.status.length === 0 || filters.status.includes(record.status);

      const recordDate = record.date ? (typeof record.date === 'string' ? new Date(record.date) : (record.date as any).toDate()) : new Date();
      const dateMatch = !filters.dateRange?.from || !filters.dateRange?.to || isWithinInterval(recordDate, { start: filters.dateRange.from, end: filters.dateRange.to });

      return searchMatch && techMatch && customerMatch && statusMatch && dateMatch;
    }).sort((a,b) => {
        const dateA = a.date ? (typeof a.date === 'string' ? new Date(a.date) : (a.date as any).toDate()).getTime() : 0;
        const dateB = b.date ? (typeof b.date === 'string' ? new Date(b.date) : (b.date as any).toDate()).getTime() : 0;
        return dateB - dateA;
    });
  }, [allRecords, searchTerm, filters]);
  
  const handleViewDetails = (record: ServiceRecord) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  const toggleStatusFilter = (status: ServiceRecordStatus) => {
    setFilters(prev => {
        const newStatus = prev.status.includes(status) 
            ? prev.status.filter(s => s !== status) 
            : [...prev.status, status];
        return {...prev, status: newStatus};
    });
  };

  const getRecordDate = (record: ServiceRecord) => {
    if (!record.date) return 'N/A';
    const date = typeof record.date === 'string' ? new Date(record.date) : (record.date as any).toDate();
    return format(date, 'P');
  }

  const handleDownloadReport = () => {
    const dataToExport = filteredRecords.map(r => ({
      Date: getRecordDate(r),
      Customer: r.customer,
      Technician: r.technician,
      Address: r.address,
      Total: r.total,
      Status: r.status,
      'Payment Method': r.paymentMethod || 'N/A',
      Description: r.description,
      'File URL': r.fileUrl,
    }));
    downloadCsv(dataToExport, `service-records-report-${new Date().toISOString().split('T')[0]}.csv`);
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredRecords.map(r => r.id));
    } else {
      setSelectedRows([]);
    }
  }

  const handleRowSelect = (rowId: string) => {
    setSelectedRows(prev => 
      prev.includes(rowId) 
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );
  }
  
  const handleDeleteSelected = () => {
    if (!firestore) return;

    const recordsToDelete = allRecords.filter(r => selectedRows.includes(r.id));
    
    recordsToDelete.forEach(record => {
      const recordRef = doc(firestore, 'customers', record.customerId, 'serviceRecords', record.id);
      deleteDocumentNonBlocking(recordRef);
    });
    
    toast({
        title: `${selectedRows.length} record(s) deleted`,
        description: 'The selected records have been removed.'
    });

    setSelectedRows([]);
  }

  const isAllSelected = filteredRecords.length > 0 && selectedRows.length === filteredRecords.length;
  const isSomeSelected = selectedRows.length > 0 && selectedRows.length < filteredRecords.length;
  
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          
          <p className="text-muted-foreground">A consolidated view of all service records.</p>
        </div>
        <div className="flex items-center gap-2">
           {selectedRows.length > 0 && (
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedRows.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedRows.length} service record(s). This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
           )}
           <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Import from CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>
      
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
             <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="max-w-xs"
            />
            <Select value={filters.technician} onValueChange={(value) => setFilters(f => ({...f, technician: value === 'all' ? '' : value}))}>
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
             <Select value={filters.customer} onValueChange={(value) => setFilters(f => ({...f, customer: value === 'all' ? '' : value}))}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {allCustomers.map(cust => (
                        <SelectItem key={cust.id} value={cust.id}>{cust.name}</SelectItem>
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
                    onSelect={(range) => setFilters(f => ({...f, dateRange: range}))}
                    numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <ListFilter className="mr-2 h-4 w-4" />
                    Status
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(['Scheduled', 'Completed', 'Paid', 'Owed', 'Estimate', 'No Charge'] as ServiceRecordStatus[]).map(status => (
                    <DropdownMenuCheckboxItem
                    key={status}
                    checked={filters.status.includes(status)}
                    onCheckedChange={() => toggleStatusFilter(status)}
                    >
                    {status}
                    </DropdownMenuCheckboxItem>
                ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </Card>


      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead padding="checkbox" className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    aria-label="Select all"
                    data-state={isSomeSelected ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? filteredRecords.map(record => (
                <TableRow key={record.id} data-state={selectedRows.includes(record.id) && 'selected'}>
                   <TableCell padding="checkbox">
                    <Checkbox
                        checked={selectedRows.includes(record.id)}
                        onCheckedChange={() => handleRowSelect(record.id)}
                        aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell>{getRecordDate(record)}</TableCell>
                  <TableCell>{record.customer}</TableCell>
                  <TableCell>{record.technician}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(record.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(record.status)} className="capitalize">
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.status === 'Paid' ? record.paymentMethod || 'N/A' : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(record)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No records found. Use the 'Import from CSV' button to get started.
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

       <ImportCsvDialog
        isOpen={isImportOpen}
        onOpenChange={setIsImportOpen}
      />
    </>
  );
}
