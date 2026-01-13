
'use client';

import * as React from 'react';
import type { PriceBookEntry } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { PlusCircle, Download } from 'lucide-react';
import { MOCK_PRICE_BOOK } from '@/lib/mock-data';
// import UploadPriceBookDialog from './UploadPriceBookDialog';

export default function PriceBookPage() {
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);

  // Using mock data instead of Firestore
  const priceBookEntries = MOCK_PRICE_BOOK;

  const getEntryDate = (entry: PriceBookEntry) => {
    if (!entry.uploadedAt) return 'N/A';
    const date = new Date(entry.uploadedAt as any);
    return format(date, 'PPP p');
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Price Book</h1>
          <p className="text-muted-foreground">Manage your pricing documents.</p>
        </div>
        <Button size="sm" onClick={() => setIsUploadOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Date Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceBookEntries && priceBookEntries.length > 0 ? (
                priceBookEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.fileName}</TableCell>
                    <TableCell>{getEntryDate(entry)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <a href={entry.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No price book documents found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* 
      // We will add this component in the next step
      <UploadPriceBookDialog
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
      /> 
      */}
    </>
  );
}
