import * as React from 'react';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ServiceRecord } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Bot, Edit, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type RecordDetailsSheetProps = {
  record: ServiceRecord | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRecordUpdated?: (record: ServiceRecord) => void;
};

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-2 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="col-span-2 font-medium">{value || 'N/A'}</span>
  </div>
);

const EditableDetailItem = ({ label, value, onChange, name }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; name: string; }) => (
    <div className="grid grid-cols-3 items-center gap-2 text-sm">
      <Label htmlFor={name} className="text-muted-foreground">{label}</Label>
      <Input id={name} name={name} value={value} onChange={onChange} className="col-span-2 h-8" />
    </div>
);

export default function RecordDetailsSheet({ record, isOpen, onOpenChange, onRecordUpdated }: RecordDetailsSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecord, setEditedRecord] = useState<Partial<ServiceRecord> | null>(record);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  React.useEffect(() => {
    setEditedRecord(record);
    setIsEditing(false);
  }, [record]);

  if (!record) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedRecord(prev => prev ? { ...prev, [name]: value } : null);
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setEditedRecord(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = () => {
    if (!firestore || !editedRecord || !editedRecord.id) return;

    const recordToSave = { ...editedRecord };
    // Convert total back to number if it was edited as a string
    if (typeof recordToSave.total === 'string') {
        recordToSave.total = parseFloat(recordToSave.total) || 0;
    }

    const techRecordRef = doc(firestore, 'technicians', record.technicianId, 'serviceRecords', record.id);
    const customerRecordRef = doc(firestore, 'customers', record.customerId, 'serviceRecords', record.id);
    
    // Non-blocking updates
    setDocumentNonBlocking(techRecordRef, recordToSave, { merge: true });
    setDocumentNonBlocking(customerRecordRef, recordToSave, { merge: true });

    toast({
        title: "Record Saved",
        description: "The service record has been updated."
    });

    if (onRecordUpdated) {
        onRecordUpdated(recordToSave as ServiceRecord);
    }
    setIsEditing(false);
  };

  const getRecordDate = () => {
    if (!record.date) return 'N/A';
    const date = typeof record.date === 'string' ? new Date(record.date) : (record.date as any).toDate();
    return format(date, 'PPP');
  }

  const renderContent = () => {
    const currentData = isEditing ? editedRecord : record;
    if (!currentData) return null;

    if (isEditing) {
      return (
        <div className="space-y-4">
            <div className="space-y-3">
                <h3 className="font-semibold text-base">Record Information</h3>
                <EditableDetailItem label="Customer" name="customer" value={currentData.customer || ''} onChange={handleInputChange} />
                <EditableDetailItem label="Technician" name="technician" value={currentData.technician || ''} onChange={handleInputChange} />
                <EditableDetailItem label="Address" name="address" value={currentData.address || ''} onChange={handleInputChange} />
                <EditableDetailItem label="Phone" name="phone" value={currentData.phone || ''} onChange={handleInputChange} />
            </div>
            <Separator />
            <div className="space-y-3">
                <h3 className="font-semibold text-base">Equipment Details</h3>
                <EditableDetailItem label="Model" name="model" value={currentData.model || ''} onChange={handleInputChange} />
                <EditableDetailItem label="Serial #" name="serial" value={currentData.serial || ''} onChange={handleInputChange} />
                <EditableDetailItem label="Filter Size" name="filterSize" value={currentData.filterSize || ''} onChange={handleInputChange} />
                <EditableDetailItem label="Freon Type" name="freonType" value={currentData.freonType || ''} onChange={handleInputChange} />
            </div>
            <Separator />
            <div className="space-y-3">
                <h3 className="font-semibold text-base">Job Details</h3>
                <EditableDetailItem label="Labor Hours" name="laborHours" value={currentData.laborHours || ''} onChange={handleInputChange} />
                <div className="grid grid-cols-3 gap-2 text-sm">
                    <Label htmlFor="description" className="text-muted-foreground pt-1">Description</Label>
                    <Textarea id="description" name="description" value={currentData.description || ''} onChange={handleInputChange} className="col-span-2" />
                </div>
            </div>
            <Separator />
            <div className="space-y-3">
                <h3 className="font-semibold text-base">Billing</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                    <Label htmlFor="breakdown" className="text-muted-foreground pt-1">Breakdown</Label>
                    <Textarea id="breakdown" name="breakdown" value={currentData.breakdown || ''} onChange={handleInputChange} className="col-span-2" />
                </div>
                <EditableDetailItem label="Total" name="total" value={String(currentData.total || '0')} onChange={handleInputChange} />
                <div className="grid grid-cols-3 items-center gap-2 text-sm">
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="col-span-2">
                        <Select name="status" value={currentData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                            <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Owed">Owed</SelectItem>
                                <SelectItem value="Estimate">Estimate</SelectItem>
                                <SelectItem value="No Charge">No Charge</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
      );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="font-semibold text-base flex items-center gap-2">
                    <Bot className="h-4 w-4" /> AI Summary
                </h3>
                <p className="text-sm bg-accent/50 p-3 rounded-md border border-accent">
                {currentData.summary}
                </p>
            </div>
            <Separator />
            <div className="space-y-3">
                <h3 className="font-semibold text-base">Record Information</h3>
                <DetailItem label="Customer" value={currentData.customer} />
                <DetailItem label="Technician" value={currentData.technician} />
                <DetailItem label="Date" value={getRecordDate()} />
                <DetailItem label="Address" value={<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentData.address || '')}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{currentData.address}</a>} />
                <DetailItem label="Phone" value={<a href={`tel:${currentData.phone}`} className="hover:underline">{currentData.phone}</a>} />
            </div>
            <Separator />
            <div className="space-y-3">
                <h3 className="font-semibold text-base">Equipment Details</h3>
                <DetailItem label="Model" value={currentData.model} />
                <DetailItem label="Serial #" value={currentData.serial} />
                <DetailItem label="Filter Size" value={currentData.filterSize} />
                <DetailItem label="Freon Type" value={currentData.freonType} />
            </div>
            <Separator />
            <div className="space-y-3">
                <h3 className="font-semibold text-base">Job Details</h3>
                <DetailItem label="Labor Hours" value={currentData.laborHours} />
                <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground">Description</span>
                <p className="col-span-2">{currentData.description}</p>
                </div>
            </div>
            <Separator />
            <div className="space-y-3">
                <h3 className="font-semibold text-base">Billing</h3>
                <DetailItem label="Breakdown" value={currentData.breakdown} />
                <DetailItem label="Total" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentData.total || 0)} />
                <div className="grid grid-cols-3 gap-2 text-sm items-center">
                    <span className="text-muted-foreground">Status</span>
                    <div className="col-span-2">
                        <Badge variant={currentData.status === 'Paid' ? 'secondary' : currentData.status === 'Owed' ? 'destructive' : 'default'} className="capitalize">
                        {currentData.status}
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full">
        <SheetHeader className="pr-8">
            <div className="flex items-center justify-between">
                <div>
                    <SheetTitle>Service Record Details</SheetTitle>
                    <SheetDescription>
                        Work performed for {record.customer} on {getRecordDate()}.
                    </SheetDescription>
                </div>
                {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setEditedRecord(record); }}>
                            <X className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" /> Save
                        </Button>
                    </div>
                )}
            </div>
        </SheetHeader>
        <div className="py-6 overflow-y-auto h-[calc(100vh-12rem)] pr-6">
          {renderContent()}
        </div>
        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button asChild className="w-full" variant="secondary">
            <a href={record.fileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> View Original Document
            </a>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
