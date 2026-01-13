
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
import { processCsvImport } from '@/app/actions';
import { Loader2, UploadCloud } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type ImportCsvDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function ImportCsvDialog({ isOpen, onOpenChange }: ImportCsvDialogProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to import.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
        const fileContent = await selectedFile.text();
        const formData = new FormData();
        formData.append('fileContent', fileContent);
        
        const result = await processCsvImport(formData);

        if (result.success) {
            toast({
                title: 'Import Successful',
                description: `${result.count} records have been imported. The page will now refresh.`,
            });
            // A simple way to refresh the data is to reload the page.
            window.location.reload();
        } else {
            // Use the specific error from the server action
            throw new Error(result.error || 'An unknown error occurred during import.');
        }

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

    