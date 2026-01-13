'use client';

import * as React from 'react';
import type { ServiceRecord, ServiceRecordStatus } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import RecordDetailsSheet from './RecordDetailsSheet';
import UploadRecordDialog from './UploadRecordDialog';
import { PlusCircle, ListFilter } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { format } from 'date-fns';

type RecordsPageClientProps = {
  initialRecords: ServiceRecord[];
};

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

export default function RecordsPageClient({ initialRecords }: RecordsPageClientProps) {
  const [records, setRecords] = React.useState<ServiceRecord[]>(initialRecords);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<ServiceRecordStatus[]>([]);
  const [selectedRecord, setSelectedRecord] = React.useState<ServiceRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);

  React.useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  const filteredRecords = React.useMemo(() => {
    return records.filter(record => {
      const searchMatch =
        searchTerm === '' ||
        record.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.technician?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.address?.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilter.length === 0 || statusFilter.includes(record.status);

      return searchMatch && statusMatch;
    }).sort((a,b) => {
        const dateA = a.date ? (typeof a.date === 'string' ? new Date(a.date) : (a.date as any).toDate()).getTime() : 0;
        const dateB = b.date ? (typeof b.date === 'string' ? new Date(b.date) : (b.date as any).toDate()).getTime() : 0;
        return dateB - dateA;
    });
  }, [records, searchTerm, statusFilter]);
  
  const handleViewDetails = (record: ServiceRecord) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  const handleAddNewRecord = (newRecord: ServiceRecord) => {
    setRecords(prev => [newRecord, ...prev]);
  };

  const toggleStatusFilter = (status: ServiceRecordStatus) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
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
          <h1 className="text-2xl font-bold tracking-tight">Service Records</h1>
          <p className="text-muted-foreground">Manage and analyze all your service records.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ListFilter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(['Scheduled', 'Completed', 'Paid', 'Owed', 'Estimate', 'No Charge'] as ServiceRecordStatus[]).map(status => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter.includes(status)}
                  onCheckedChange={() => toggleStatusFilter(status)}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => setIsUploadOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <Input
          placeholder="Search by customer, tech, address, or description..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? filteredRecords.map(record => (
                <TableRow key={record.id}>
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
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(record)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No records found.
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

      <UploadRecordDialog
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onRecordAdded={handleAddNewRecord}
      />
    </>
  );
}
