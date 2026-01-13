'use client';

import * as React from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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
// We'll create this component next
// import UploadPriceBookDialog from './UploadPriceBookDialog';

export default function PriceBookPage() {
  const { firestore, user } = useFirebase();
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);

  const priceBookQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'technicians', user.uid, 'priceBookEntries'),
      orderBy('uploadedAt', 'desc')
    );
  }, [firestore, user]);

  const { data: priceBookEntries, isLoading } = useCollection<PriceBookEntry>(priceBookQuery);

  const getEntryDate = (entry: PriceBookEntry) => {
    if (!entry.uploadedAt) return 'N/A';
    const date = (entry.uploadedAt as any).toDate();
    return format(date, 'PPP p');
  };
  
  if (isLoading) {
    return <div>Loading price book...</div>;
  }

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

    