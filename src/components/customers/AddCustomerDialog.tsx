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
import { addCustomerAndJob } from '@/app/actions';
import { useFirebase } from '@/firebase';
import { Loader2 } from 'lucide-react';

type AddCustomerDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function AddCustomerDialog({ isOpen, onOpenChange }: AddCustomerDialogProps) {
  const { toast } = useToast();
  const { user } = useFirebase();
  const [isSaving, setIsSaving] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to add a customer.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    formData.append('technicianId', user.uid);

    const result = await addCustomerAndJob(formData);

    if (result.success) {
      toast({
        title: 'Customer and Job Added',
        description: 'The new customer and their scheduled job have been created.',
      });
      onOpenChange(false);
      formRef.current?.reset();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'An unknown error occurred.',
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                name="jobDescription"
                placeholder="e.g., Annual HVAC maintenance check..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
  );
}
