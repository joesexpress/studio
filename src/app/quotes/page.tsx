
'use client';

import * as React from 'react';
import type { Quote } from '@/lib/types';
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
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import AddQuoteDialog from '@/components/quotes/AddQuoteDialog';
import { Badge } from '@/components/ui/badge';
import type { QuoteStatus } from '@/lib/types';
import { downloadCsv } from '@/lib/utils';

const getStatusVariant = (status: QuoteStatus) => {
    switch (status) {
      case 'Accepted':
        return 'secondary';
      case 'Sent':
        return 'default';
      case 'Declined':
        return 'destructive';
      case 'Draft':
        return 'outline';
      default:
        return 'outline';
    }
  };


export default function QuotesPage() {
  const [isAddQuoteOpen, setIsAddQuoteOpen] = React.useState(false);
  const { firestore, user, isAuthReady } = useFirebase();

  const quotesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'quotes'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: quotes, isLoading: isQuotesLoading } = useCollection<Quote>(quotesQuery, { skip: !isAuthReady });
  
  const getQuoteDate = (quote: Quote, field: 'createdAt' | 'validUntil') => {
    const dateValue = quote[field];
    if (!dateValue) return 'N/A';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : (dateValue as any).toDate();
    return format(date, 'P');
  }

  const handleDownloadReport = () => {
    if (!quotes) return;
    const dataToExport = quotes.map(q => ({
      Created: getQuoteDate(q, 'createdAt'),
      Customer: q.customerName,
      Price: q.quotePrice,
      Status: q.status,
      Expires: getQuoteDate(q, 'validUntil'),
      'Scope of Work': q.scopeOfWork,
      'Labor Required': q.laborRequired,
      'Materials Needed': q.materialsNeeded,
    }));
    downloadCsv(dataToExport, `quotes-report-${new Date().toISOString().split('T')[0]}.csv`);
  }
  
  const isLoading = !isAuthReady || isQuotesLoading;

  if (isLoading) {
    return <div>Loading quotes...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quoted Jobs</h1>
          <p className="text-muted-foreground">
            Create and manage job quotes for customers.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                <Download className="mr-2 h-4 w-4" />
                Download Report
            </Button>
            <Button size="sm" onClick={() => setIsAddQuoteOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Quote
            </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes && quotes.length > 0 ? (
                quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>{getQuoteDate(quote, 'createdAt')}</TableCell>
                    <TableCell className="font-medium">{quote.customerName}</TableCell>
                    <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(quote.quotePrice)}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(quote.status)} className="capitalize">
                            {quote.status}
                        </Badge>
                    </TableCell>
                    <TableCell>{getQuoteDate(quote, 'validUntil')}</TableCell>
                    <TableCell className="text-right">
                      {/* Placeholder for future actions like 'View Details' */}
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No quotes found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AddQuoteDialog
        isOpen={isAddQuoteOpen}
        onOpenChange={setIsAddQuoteOpen}
      />
    </>
  );
}
