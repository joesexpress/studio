
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import Papa from 'papaparse';
import { useFirebase } from '@/firebase';
import { MOCK_TECHNICIANS } from '@/lib/mock-data';
import { doc, collection, getDocs, query, where, limit, setDoc, writeBatch } from 'firebase/firestore';
import type { ServiceRecord, Customer } from '@/lib/types';
import { Progress } from '@/components/ui/progress';


type ImportCsvDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function ImportCsvDialog({ isOpen, onOpenChange }: ImportCsvDialogProps) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [progress, setProgress] = React.useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({ title: 'No file selected', variant: 'destructive' });
      return;
    }
     if (!firestore) {
      toast({ title: 'Database not ready', variant: 'destructive' });
      return;
    }
    
    setIsUploading(true);
    setProgress(0);
    
    try {
      const fileContent = await selectedFile.text();
      const parsedData = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim(),
      });
  
      if (parsedData.errors.length > 0) {
        console.error('CSV Parsing errors:', parsedData.errors);
        const firstError = parsedData.errors[0];
        throw new Error(`CSV parsing error on row ${firstError.row}: ${firstError.message} (${firstError.code})`);
      }
  
      const records: any[] = parsedData.data;
      const totalRecords = records.length;
      let processedCount = 0;

      const customerCache = new Map<string, Customer>();
      const writePromises: Promise<any>[] = [];

      // Pre-fill customer cache
      const allCustomerDocs = await getDocs(collection(firestore, 'customers'));
      allCustomerDocs.forEach(doc => {
          const customer = doc.data() as Customer;
          customerCache.set(customer.name.trim().toLowerCase(), customer);
      });
  
      for (const [index, record] of records.entries()) {
        const customerName = record.Customer || 'N/A';
        if (customerName === 'N/A' || !customerName.trim()) {
            processedCount++;
            setProgress((processedCount / totalRecords) * 100);
            continue; // Skip rows without a customer name
        };

        const techName = record.Tech || 'N/A';
        const technician = MOCK_TECHNICIANS.find(t => t.name.toLowerCase() === techName.toLowerCase());
        const technicianId = technician?.id || 'tbd';

        let customerId = '';
        const normalizedCustomerName = customerName.trim().toLowerCase();

        // 1. Find or create customer
        let customer = customerCache.get(normalizedCustomerName);

        if (!customer) {
            const newCustomerId = `cust-${normalizedCustomerName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
            const newCustomerData: Partial<Customer> = {
                id: newCustomerId,
                name: customerName.trim(),
                address: record.Address || 'N/A',
                phone: record.Phone || 'N/A',
            };
            const customerDocRef = doc(firestore, 'customers', newCustomerId);
            writePromises.push(setDoc(customerDocRef, newCustomerData, { merge: true }));
            customer = newCustomerData as Customer;
            customerCache.set(normalizedCustomerName, customer);
            customerId = newCustomerId;
        } else {
            customerId = customer.id;
        }
  
        const recordId = `rec-${customerId}-${record.Date ? new Date(record.Date).getTime() : Date.now()}-${index}`;
  
        const total = parseFloat(record.Total?.replace(/[^0-9.-]+/g,"")) || 0;
        
        let recordDate;
        if (record.Date) {
          const parsedDate = new Date(record.Date);
          // Check if the parsed date is valid. If not, default to now.
          if (!isNaN(parsedDate.getTime())) {
            recordDate = parsedDate;
          } else {
            console.warn(`Invalid date format for record, using current date: ${record.Date}`);
            recordDate = new Date();
          }
        } else {
          recordDate = new Date();
        }
  
        const description = record['Full Description of Work'] || 'N/A';
        const summary = description.length > 100 ? description.substring(0, 100) + '...' : description;
  
        const newRecord: Omit<ServiceRecord, 'date'> & { date: any } = {
          id: recordId,
          customer: customerName.trim(),
          technician: techName,
          date: recordDate,
          summary: summary,
          address: record.Address || 'N/A',
          phone: record.Phone || 'N/A',
          model: record.Model || 'N/A',
          serial: record.Serial || 'N/A',
          filterSize: record['Filter Size'] || 'N/A',
          freonType: record.Freon || 'N/A',
          laborHours: String(record['Total Hours'] || 'N/A'),
          breakdown: String(record.Breakdown || 'N/A'),
          description: description,
          total: total,
          fileUrl: record['File Link'] || '#',
          technicianId: technicianId,
          customerId: customerId,
          status: (record.Status as any) || 'N/A'
        };
  
        // Add write operation to the list
        const customerRecordRef = doc(firestore, 'customers', customerId, 'serviceRecords', recordId);
        writePromises.push(setDoc(customerRecordRef, newRecord, { merge: true }));
        
        processedCount++;
        setProgress((processedCount / totalRecords) * 100);
      }

      // Execute all writes in parallel
      await Promise.all(writePromises);
      
      toast({
        title: 'Import Successful',
        description: `${processedCount} records have been imported.`,
      });
      onDialogClose(false);

    } catch (e: any) {
        console.error('CSV Import Error:', e);
        toast({
            title: 'Import Failed',
            description: e.message,
            variant: 'destructive',
            duration: 10000, // Show error for longer
        });
    } finally {
        setIsUploading(false);
    }
  };
  
  const onDialogClose = (open: boolean) => {
    if (!open) {
        setSelectedFile(null);
        setProgress(0);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk-import service records.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <Alert>
                <AlertTitle>Required CSV Format</AlertTitle>
                <AlertDescription className="text-xs">
                    Your file must contain these exact headers: <br/>
                    <code className="font-mono bg-muted p-1 rounded-sm">Date,Tech,Customer,Address,Phone,Model,Serial,Filter Size,Freon,Total Hours,Breakdown,Full Description of Work,Total,Status,File Link</code>
                </AlertDescription>
            </Alert>
            <div 
                className="flex items-center justify-center w-full"
                onClick={() => fileInputRef.current?.click()}
            >
                <Label 
                    htmlFor="csv-file"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/50"
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                        {selectedFile ? (
                           <p className="font-semibold text-primary">{selectedFile.name}</p>
                        ) : (
                           <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                        )}
                    </div>
                    <Input 
                        id="csv-file" 
                        type="file" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        accept=".csv"
                    />
                </Label>
            </div> 
            {isUploading && (
                <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-sm text-center text-muted-foreground">{Math.round(progress)}% complete</p>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onDialogClose(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleImport} disabled={isUploading || !selectedFile}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              `Import Records`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
