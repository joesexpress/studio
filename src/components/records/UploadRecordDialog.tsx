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

type UploadRecordDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRecordAdded: (record: ServiceRecord) => void;
};

export default function UploadRecordDialog({ isOpen, onOpenChange, onRecordAdded }: UploadRecordDialogProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a service record file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = async () => {
      const fileDataUri = reader.result as string;
      const formData = new FormData();
      formData.append('file', fileDataUri);
      
      const result = await processServiceRecord(formData);

      if (result.success && result.record) {
        toast({
          title: 'Upload Successful',
          description: 'The service record has been processed and added.',
        });
        onRecordAdded(result.record as ServiceRecord);
        onOpenChange(false);
      } else {
        toast({
          title: 'Upload Failed',
          description: result.error || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
      setIsUploading(false);
      setSelectedFile(null);
    };
    reader.onerror = () => {
        toast({
            title: 'File Read Error',
            description: 'Could not read the selected file.',
            variant: 'destructive',
        });
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
          <DialogTitle>Upload Service Record</DialogTitle>
          <DialogDescription>
            Select a document (PDF, JPG, PNG) to automatically extract service details.
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
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                        {selectedFile ? (
                             <p className="font-semibold text-primary">{selectedFile.name}</p>
                        ) : (
                            <>
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PDF, PNG, JPG</p>
                            </>
                        )}
                    </div>
                    <Input 
                        id="picture" 
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
              'Upload and Process'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
