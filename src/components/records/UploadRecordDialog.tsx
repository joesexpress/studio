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
import { processServiceRecord } from '@/app/actions';
import type { ServiceRecord } from '@/lib/types';
import { Loader2, UploadCloud } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type UploadRecordDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRecordAdded: (record: ServiceRecord) => void;
};

export default function UploadRecordDialog({ isOpen, onOpenChange, onRecordAdded }: UploadRecordDialogProps) {
  const { toast } = useToast();
  const { storage } = useFirebase();
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[] | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Using a mock user ID as login is removed.
  const mockUserId = 'tech-jake';

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      if (files.length > 20) {
        toast({
            title: 'Too many files',
            description: 'You can upload a maximum of 20 files at a time.',
            variant: 'destructive',
        });
        setSelectedFiles(files.slice(0, 20));
      } else {
        setSelectedFiles(files);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select one or more service record files to upload.',
        variant: 'destructive',
      });
      return;
    }
    if (!storage) {
        toast({ title: 'Storage service not available', variant: 'destructive' });
        return;
    }
    
    setIsUploading(true);
    
    toast({
        title: 'Upload Started',
        description: `Processing ${selectedFiles.length} service record(s). This may take a moment.`,
    });

    const uploadPromises = selectedFiles.map(file => {
      return new Promise<{ success: boolean, fileName: string, error?: string }>(async (resolve) => {
        try {
            // 1. Upload file to Firebase Storage
            const filePath = `service-records/${mockUserId}/${Date.now()}-${file.name}`;
            const storageRef = ref(storage, filePath);
            const uploadResult = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(uploadResult.ref);

            // 2. Pass the URL to the server action
            const formData = new FormData();
            formData.append('fileUrl', downloadURL);
            formData.append('technicianId', mockUserId);
            
            const result = await processServiceRecord(formData);
      
            if (!result.success) {
              resolve({ success: false, fileName: file.name, error: result.error });
            } else {
              if (result.record) {
                // This will optimistically update the UI, but page reload will show the source of truth
                onRecordAdded(result.record);
              }
              resolve({ success: true, fileName: file.name });
            }
        } catch (e: any) {
            console.error(`Error processing ${file.name}:`, e);
            resolve({ success: false, fileName: file.name, error: e.message || 'An unexpected error occurred during processing.' });
        }
      });
    });

    const results = await Promise.all(uploadPromises);
    const failedUploads = results.filter(r => !r.success);

    setIsUploading(false);
    setSelectedFiles(null);
    onOpenChange(false);

    if (failedUploads.length > 0) {
        toast({
            title: 'Some Uploads Failed',
            description: `${failedUploads.map(f => f.fileName).join(', ')}. Reason: ${failedUploads[0].error}`,
            variant: 'destructive',
            duration: 10000,
        });
    } else {
        toast({
            title: 'Upload Complete',
            description: 'All service records have been processed successfully.',
        });
    }
  };
  
  const onDialogClose = (open: boolean) => {
    if (!open) {
        setSelectedFiles(null);
    }
    onOpenChange(open);
  }

  const renderSelectedFiles = () => {
    if (!selectedFiles || selectedFiles.length === 0) {
        return (
            <>
                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-muted-foreground">PDF, PNG, JPG (up to 20 files)</p>
            </>
        )
    }

    if (selectedFiles.length === 1) {
        return <p className="font-semibold text-primary">{selectedFiles[0].name}</p>
    }

    return <p className="font-semibold text-primary">{selectedFiles.length} files selected</p>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Service Records</DialogTitle>
          <DialogDescription>
            Select up to 20 documents (PDF, JPG, PNG) to automatically extract service details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div 
                className="flex items-center justify-center w-full"
                onClick={() => fileInputRef.current?.click()}
            >
                <Label 
                    htmlFor="picture"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/50"
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                        {renderSelectedFiles()}
                    </div>
                    <Input 
                        id="picture" 
                        type="file" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        accept=".pdf,.png,.jpg,.jpeg"
                        multiple
                    />
                </Label>
            </div> 
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleUpload} disabled={isUploading || !selectedFiles || selectedFiles.length === 0}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Upload and Process ${selectedFiles?.length || ''} File(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
