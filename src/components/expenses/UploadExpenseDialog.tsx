
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
import { useFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


type UploadExpenseDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function UploadExpenseDialog({ isOpen, onOpenChange }: UploadExpenseDialogProps) {
  const { toast } = useToast();
  const { firestore, storage } = useFirebase();
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [vendor, setVendor] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  // Using a mock user ID as login is removed.
  const mockUserId = 'tech-jake';

  const resetForm = () => {
    setVendor('');
    setDescription('');
    setAmount('');
    setDate(new Date());
    setSelectedFile(null);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!vendor || !description || !amount || !date) {
        toast({ title: 'Please fill out all fields.', variant: 'destructive'});
        return;
    }
    if (!firestore || !storage) {
      toast({ title: 'Firebase service error', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    toast({ title: 'Saving expense...', description: 'Please wait.' });

    try {
      let receiptUrl = '#';

      if (selectedFile) {
        const fileDataUri = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });

        // 1. Upload file to Firebase Storage
        const filePath = `receipts/${mockUserId}/${Date.now()}-${selectedFile.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = await uploadString(storageRef, fileDataUri, 'data_url');
        receiptUrl = await getDownloadURL(uploadTask.ref);
      }
      
      const expenseId = `exp-${Date.now()}`;
      
      // 2. Save the new expense record to Firestore
      const expenseRef = doc(firestore, 'technicians', mockUserId, 'expenses', expenseId);
      const newExpense = {
        id: expenseId,
        date: date,
        technicianId: mockUserId,
        vendor: vendor,
        description: description,
        amount: parseFloat(amount.replace(/[^0-9.-]+/g, '')) || 0,
        receiptUrl: receiptUrl,
      };

      await addDocumentNonBlocking(collection(firestore, 'technicians', mockUserId, 'expenses'), newExpense);
      
      toast({ title: 'Expense Added', description: 'The expense has been successfully recorded.' });
      onDialogClose(false);

    } catch (error: any) {
      console.error("Error uploading expense:", error);
      toast({
        title: 'Save Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const onDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Manually enter the details of the expense.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input id="vendor" value={vendor} onChange={e => setVendor(e.target.value)} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="receiptFile">Receipt (Optional)</Label>
                <div 
                    className="flex items-center justify-center w-full"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Label 
                        htmlFor="receiptFile"
                        className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/50"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                            {selectedFile ? (
                                <p className="font-semibold text-primary">{selectedFile.name}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground"><span className="font-semibold">Upload receipt</span></p>
                            )}
                        </div>
                        <Input 
                            id="receiptFile" 
                            type="file" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            accept=".pdf,.png,.jpg,.jpeg"
                        />
                    </Label>
                </div> 
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onDialogClose(false)}>Cancel</Button>
          <Button type="submit" onClick={handleUpload} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              `Save Expense`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
