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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { Loader2, UserPlus, Building } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import type { Customer, Quote, QuoteStatus } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

type AddQuoteDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function AddQuoteDialog({ isOpen, onOpenChange }: AddQuoteDialogProps) {
  const { toast } = useToast();
  const { user, firestore } = useFirebase();
  const [isSaving, setIsSaving] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  
  const [customerType, setCustomerType] = React.useState('existing');
  const [selectedCustomerId, setSelectedCustomerId] = React.useState('');

  // New Customer State
  const [newCustomerName, setNewCustomerName] = React.useState('');
  const [newCustomerAddress, setNewCustomerAddress] = React.useState('');
  const [newCustomerPhone, setNewCustomerPhone] = React.useState('');

  // Quote fields state
  const [quotePrice, setQuotePrice] = React.useState('');
  const [validUntil, setValidUntil] = React.useState<Date | undefined>();
  const [scopeOfWork, setScopeOfWork] = React.useState('');
  const [laborRequired, setLaborRequired] = React.useState('');
  const [materialsNeeded, setMaterialsNeeded] = React.useState('');
  const [status, setStatus] = React.useState<QuoteStatus>('Draft');
  
  const customersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'customers');
  }, [firestore]);
  const { data: customers } = useCollection<Omit<Customer, 'records'>>(customersQuery);

  const resetForm = () => {
    setCustomerType('existing');
    setSelectedCustomerId('');
    setNewCustomerName('');
    setNewCustomerAddress('');
    setNewCustomerPhone('');
    setQuotePrice('');
    setValidUntil(undefined);
    setScopeOfWork('');
    setLaborRequired('');
    setMaterialsNeeded('');
    setStatus('Draft');
    formRef.current?.reset();
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !firestore) {
      toast({ title: 'Authentication Error', variant: 'destructive' });
      return;
    }
    
    let customerId = '';
    let customerName = '';
    let customerAddress = '';
    let customerPhone = '';

    setIsSaving(true);
    
    try {
        if (customerType === 'new') {
            if (!newCustomerName || !newCustomerAddress || !newCustomerPhone) {
                toast({ title: 'New customer details are required.', variant: 'destructive' });
                setIsSaving(false);
                return;
            }
            customerId = `cust-${newCustomerName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;
            customerName = newCustomerName;
            customerAddress = newCustomerAddress;
            customerPhone = newCustomerPhone;

            const customerRef = doc(firestore, 'customers', customerId);
            setDocumentNonBlocking(customerRef, {
                id: customerId,
                name: customerName,
                address: customerAddress,
                phone: customerPhone,
            }, { merge: true });

        } else {
            if (!selectedCustomerId) {
                toast({ title: 'Please select a customer.', variant: 'destructive' });
                setIsSaving(false);
                return;
            }
            const existingCustomer = customers?.find(c => c.id === selectedCustomerId);
            if (!existingCustomer) {
                toast({ title: 'Selected customer not found.', variant: 'destructive' });
                setIsSaving(false);
                return;
            }
            customerId = existingCustomer.id;
            customerName = existingCustomer.name;
            customerAddress = existingCustomer.address;
            customerPhone = existingCustomer.phone;
        }

        const quoteId = `quote-${Date.now()}`;
        const newQuote = {
            id: quoteId,
            customerId,
            customerName,
            customerAddress,
            customerPhone,
            quotePrice: parseFloat(quotePrice) || 0,
            validUntil,
            scopeOfWork,
            laborRequired,
            materialsNeeded,
            status,
            createdAt: serverTimestamp(),
            technicianId: user.uid,
        };

        const quotesColRef = collection(firestore, 'quotes');
        await addDocumentNonBlocking(quotesColRef, newQuote);

        toast({
            title: 'Quote Created',
            description: `A new quote for ${customerName} has been saved as a draft.`,
        });
        handleOpenChange(false);

    } catch (error) {
        console.error("Error creating quote:", error);
        toast({ title: 'Error', description: 'Failed to create quote.', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit} ref={formRef}>
          <DialogHeader>
            <DialogTitle>Create New Quote</DialogTitle>
            <DialogDescription>
              Fill out the details below to create a new job quote.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
            
            <div className="space-y-3">
              <Label>Customer</Label>
               <RadioGroup defaultValue="existing" value={customerType} onValueChange={setCustomerType} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="r-existing" />
                  <Label htmlFor="r-existing" className="flex items-center gap-2"><Building className="h-4 w-4" /> Existing Customer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="r-new" />
                  <Label htmlFor="r-new" className="flex items-center gap-2"><UserPlus className="h-4 w-4"/> New Customer</Label>
                </div>
              </RadioGroup>
            </div>

            {customerType === 'existing' ? (
                <div className="grid gap-2">
                    <Label htmlFor="customer">Select Customer</Label>
                    <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an existing customer" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                    <div className="grid gap-2">
                        <Label htmlFor="newCustomerName">Name</Label>
                        <Input id="newCustomerName" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="newCustomerPhone">Phone</Label>
                        <Input id="newCustomerPhone" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="newCustomerAddress">Address</Label>
                        <Input id="newCustomerAddress" value={newCustomerAddress} onChange={e => setNewCustomerAddress(e.target.value)} />
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="quotePrice">Quoted Price ($)</Label>
                    <Input id="quotePrice" type="number" value={quotePrice} onChange={e => setQuotePrice(e.target.value)} placeholder="e.g., 1500.00" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="validUntil">Valid Until</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "justify-start text-left font-normal",
                            !validUntil && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {validUntil ? format(validUntil, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={validUntil}
                            onSelect={setValidUntil}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            
            <div className="grid gap-2">
                <Label htmlFor="scopeOfWork">Scope of Work</Label>
                <Textarea id="scopeOfWork" value={scopeOfWork} onChange={e => setScopeOfWork(e.target.value)} placeholder="Describe the work to be done..." />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="laborRequired">Labor Required</Label>
                <Textarea id="laborRequired" value={laborRequired} onChange={e => setLaborRequired(e.target.value)} placeholder="e.g., 2 technicians, 4 hours..." />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="materialsNeeded">Materials Needed</Label>
                <Textarea id="materialsNeeded" value={materialsNeeded} onChange={e => setMaterialsNeeded(e.target.value)} placeholder="List required parts and materials..."/>
            </div>
            
            <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select onValueChange={(value) => setStatus(value as QuoteStatus)} value={status}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Sent">Sent</SelectItem>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                        <SelectItem value="Declined">Declined</SelectItem>
                    </SelectContent>
                </Select>
            </div>

          </div>
          <DialogFooter className="pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Quote
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
