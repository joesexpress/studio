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
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { processExpenseReceipt } from '@/app/expenses-actions';

type UploadExpenseDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function UploadExpenseDialog({ isOpen, onOpenChange }: UploadExpenseDialogProps) {
  const { toast } = useToast();
  const { user, firestore, storage } = useFirebase();
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: 'No file selected', variant: 'destructive' });
      return;
    }
    if (!user || !firestore || !storage) {
      toast({ title: 'Authentication or Firebase service error', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    toast({ title: 'Uploading receipt...', description: 'Please wait while we process the file.' });

    try {
      const fileDataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });

      // 1. Upload file to Firebase Storage
      const filePath = `receipts/${user.uid}/${Date.now()}-${selectedFile.name}`;
      const storageRef = ref(storage, filePath);
      const uploadTask = await uploadString(storageRef, fileDataUri, 'data_url');
      const receiptUrl = await getDownloadURL(uploadTask.ref);

      // 2. Call server action to process with AI
      const formData = new FormData();
      formData.append('fileDataUri', fileDataUri);
      const extractedData = await processExpenseReceipt(formData);

      if (!extractedData.success || !extractedData.data) {
        throw new Error(extractedData.error || 'Failed to extract data from receipt.');
      }
      
      const { vendor, description, amount } = extractedData.data;
      const expenseId = `exp-${Date.now()}`;
      
      // 3. Save the new expense record to Firestore
      const expenseRef = doc(firestore, 'technicians', user.uid, 'expenses', expenseId);
      const newExpense = {
        id: expenseId,
        date: serverTimestamp(),
        technicianId: user.uid,
        vendor: vendor,
        description: description,
        amount: parseFloat(amount.replace(/[^0-9.-]+/g, '')) || 0,
        receiptUrl: receiptUrl,
      };

      await setDocumentNonBlocking(expenseRef, newExpense, { merge: false });
      
      toast({ title: 'Expense Added', description: 'The expense has been successfully recorded.' });
      onDialogClose(false);

    } catch (error: any) {
      console.error("Error uploading expense:", error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const onDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedFile(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Expense Receipt</DialogTitle>
          <DialogDescription>
            Select an image of a receipt to automatically track an expense.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div 
                className="flex items-center justify-center w-full"
                onClick={() => fileInputRef.current?.click()}
            >
                <Label 
                    htmlFor="receiptFile"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/50"
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                        {selectedFile ? (
                             <p className="font-semibold text-primary">{selectedFile.name}</p>
                        ) : (
                            <>
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, or PDF</p>
                            </>
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
        <DialogFooter>
          <Button type="submit" onClick={handleUpload} disabled={isUploading || !selectedFile}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Upload and Process`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
