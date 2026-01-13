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

type UploadRecordDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRecordAdded: (record: ServiceRecord) => void;
};

export default function UploadRecordDialog({ isOpen, onOpenChange, onRecordAdded }: UploadRecordDialogProps) {
  const { toast } = useToast();
  const { user } = useFirebase();
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[] | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    if (!user) {
        toast({
            title: 'Not Authenticated',
            description: 'You must be signed in to upload a record.',
            variant: 'destructive',
        });
        return;
    }

    setIsUploading(true);
    
    toast({
        title: 'Upload Started',
        description: `Processing ${selectedFiles.length} service record(s). This may take a moment.`,
    });

    for (const file of selectedFiles) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        await new Promise<void>((resolve, reject) => {
            reader.onload = async () => {
                const fileDataUri = reader.result as string;
                const formData = new FormData();
                formData.append('file', fileDataUri);
                formData.append('technicianId', user.uid);
                
                const result = await processServiceRecord(formData);
          
                if (!result.success) {
                    toast({
                        title: `Failed to process ${file.name}`,
                        description: result.error || 'An unknown error occurred.',
                        variant: 'destructive',
                    });
                }
                resolve();
            };
            reader.onerror = () => {
                toast({
                    title: `File Read Error`,
                    description: `Could not read ${file.name}.`,
                    variant: 'destructive',
                });
                resolve(); // Resolve to continue with next file
            }
        });
    }

    setIsUploading(false);
    setSelectedFiles(null);
    toast({
        title: 'Upload Complete',
        description: 'All service records have been processed.',
    });
    onOpenChange(false);
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
