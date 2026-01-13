import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ServiceRecord } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FileText, Bot } from 'lucide-react';
import { format } from 'date-fns';

type RecordDetailsSheetProps = {
  record: ServiceRecord | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-2 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="col-span-2 font-medium">{value || 'N/A'}</span>
  </div>
);

export default function RecordDetailsSheet({ record, isOpen, onOpenChange }: RecordDetailsSheetProps) {
  if (!record) return null;

  const getRecordDate = () => {
    if (!record.date) return 'N/A';
    const date = typeof record.date === 'string' ? new Date(record.date) : (record.date as any).toDate();
    return format(date, 'PPP');
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full">
        <SheetHeader className="pr-8">
          <SheetTitle>Service Record Details</SheetTitle>
          <SheetDescription>
            Work performed for {record.customer} on {getRecordDate()}.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6 overflow-y-auto h-[calc(100vh-8rem)] pr-6">
          <div className="space-y-2">
             <h3 className="font-semibold text-base flex items-center gap-2">
                <Bot className="h-4 w-4" /> AI Summary
            </h3>
            <p className="text-sm bg-accent/50 p-3 rounded-md border border-accent">
              {record.summary}
            </p>
          </div>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Record Information</h3>
            <DetailItem label="Customer" value={record.customer} />
            <DetailItem label="Technician" value={record.technician} />
            <DetailItem label="Date" value={getRecordDate()} />
            <DetailItem label="Address" value={record.address} />
            <DetailItem label="Phone" value={record.phone} />
          </div>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Equipment Details</h3>
            <DetailItem label="Model" value={record.model} />
            <DetailItem label="Serial #" value={record.serial} />
            <DetailItem label="Filter Size" value={record.filterSize} />
            <DetailItem label="Freon Type" value={record.freonType} />
          </div>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Job Details</h3>
            <DetailItem label="Labor Hours" value={record.laborHours} />
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-muted-foreground">Description</span>
              <p className="col-span-2">{record.description}</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Billing</h3>
             <DetailItem label="Breakdown" value={record.breakdown} />
            <DetailItem label="Total" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(record.total)} />
            <div className="grid grid-cols-3 gap-2 text-sm items-center">
                <span className="text-muted-foreground">Status</span>
                <div className="col-span-2">
                    <Badge variant={record.status === 'Paid' ? 'secondary' : record.status === 'Owed' ? 'destructive' : 'default'} className="capitalize">
                      {record.status}
                    </Badge>
                </div>
            </div>
          </div>

        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button asChild className="w-full">
            <a href={record.fileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> View Original Document
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
