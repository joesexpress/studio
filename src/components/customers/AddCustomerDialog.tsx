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
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MOCK_TECHNICIANS } from '@/lib/mock-data';
import type { Customer, ServiceRecord } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';


type AddCustomerDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function AddCustomerDialog({ isOpen, onOpenChange }: AddCustomerDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [technicianId, setTechnicianId] = React.useState<string>('');
  
  const [name, setName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [jobDescription, setJobDescription] = React.useState('');

  const [potentialMatches, setPotentialMatches] = React.useState<Customer[]>([]);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = React.useState(false);

  const { firestore } = useFirebase();


  const findPotentialMatches = async () => {
    if (!firestore || !name.trim()) return [];
    
    const lowerCaseName = name.trim().toLowerCase();
    
    const customersRef = collection(firestore, 'customers');
    const q = query(customersRef);
    const querySnapshot = await getDocs(q);

    const matches: Customer[] = [];
    querySnapshot.forEach((doc) => {
        const customer = doc.data() as Customer;
        if (customer.name.toLowerCase().includes(lowerCaseName)) {
            matches.push({ ...customer, id: doc.id });
        }
    });
    return matches;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    
    // 1. Check for matches
    const matches = await findPotentialMatches();
    if (matches.length > 0) {
        setPotentialMatches(matches);
        setIsMatchDialogOpen(true);
        setIsSaving(false);
        return;
    }

    // 2. If no matches, proceed to create
    await createNewCustomerAndJob();
  };

  const createNewCustomerAndJob = async () => {
     if (!firestore) {
        toast({ title: "Database not ready", variant: "destructive"});
        setIsSaving(false);
        return;
    }
    if (!technicianId) {
        toast({
            title: 'Validation Error',
            description: 'Please select a technician.',
            variant: 'destructive',
        });
        setIsSaving(false);
        return;
    }

    const technicianName = MOCK_TECHNICIANS.find(t => t.id === technicianId)?.name || 'N/A';
    const customerId = `cust-${name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;
    const recordId = `rec-${Date.now()}`;

    const customerData: Partial<Customer> = {
      id: customerId,
      name,
      address,
      phone,
    };

    const recordData: Omit<ServiceRecord, 'date'> & { date: any } = {
      id: recordId,
      date: new Date(),
      technician: technicianName,
      customer: name,
      address,
      phone,
      model: 'N/A',
      serial: 'N/A',
      filterSize: 'N/A',
      freonType: 'N/A',
      laborHours: 'N/A',
      breakdown: 'N/A',
      description: jobDescription,
      total: 0,
      status: 'Scheduled',
      fileUrl: '#',
      summary: 'New job scheduled.',
      technicianId,
      customerId,
    };

    try {
      // Save customer profile
      const customerRef = doc(firestore, 'customers', customerId);
      setDocumentNonBlocking(customerRef, customerData, { merge: true });

      // Save service record to technician's subcollection
      const techRecordRef = doc(firestore, 'technicians', technicianId, 'serviceRecords', recordId);
      setDocumentNonBlocking(techRecordRef, recordData, {});

      // Save service record to customer's subcollection
      const customerRecordRef = doc(firestore, 'customers', customerId, 'serviceRecords', recordId);
      setDocumentNonBlocking(customerRecordRef, recordData, {});
      
      toast({
        title: 'Customer and Job Added',
        description: 'The new customer and their scheduled job have been created.',
      });
      handleOpenChange(false);

    } catch (error) {
      console.error("Error creating customer and job:", error);
      toast({ title: 'Error', description: "Failed to save new customer and job.", variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      formRef.current?.reset();
      setTechnicianId('');
      setName('');
      setAddress('');
      setPhone('');
      setJobDescription('');
    }
    onOpenChange(open);
  }

  const handleForceCreate = () => {
    setIsMatchDialogOpen(false);
    setIsSaving(true);
    createNewCustomerAndJob();
  }

  const handleUseExisting = (customerId: string) => {
    // This is a simplified version. A real implementation might create a job for the existing customer.
    // For now, we'll just close the dialogs and toast a message.
    setIsMatchDialogOpen(false);
    onOpenChange(false);
    toast({
        title: 'Action Required',
        description: `Please create the job for the existing customer from the Customers page.`,
    });
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit} ref={formRef}>
          <DialogHeader>
            <DialogTitle>Add New Customer & Job</DialogTitle>
            <DialogDescription>
              Enter the new customer's details and the initial job to be scheduled.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Customer Name</Label>
              <Input id="name" name="name" required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" required value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" required value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                name="jobDescription"
                placeholder="e.g., Annual HVAC maintenance check..."
                required
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
              />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="technician">Assign Technician</Label>
               <Select name="technicianId" onValueChange={setTechnicianId} value={technicianId}>
                  <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select a technician" />
                  </SelectTrigger>
                  <SelectContent>
                      {MOCK_TECHNICIANS.map(tech => (
                          <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Customer & Schedule Job
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Potential Duplicate Customer</AlertDialogTitle>
                <AlertDialogDescription>
                    We found existing customers with a similar name. Would you like to use one of them or create a new customer?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="max-h-60 overflow-y-auto my-4 space-y-2">
                {potentialMatches.map(match => (
                    <div key={match.id} className="p-3 border rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{match.name}</p>
                            <p className="text-sm text-muted-foreground">{match.address}</p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => handleUseExisting(match.id)}>
                            Use This Customer
                        </Button>
                    </div>
                ))}
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleForceCreate}>
                    Create New Customer
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
