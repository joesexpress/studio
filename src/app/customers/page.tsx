'use client';

import { useEffect, useState } from 'react';
import type { Customer, ServiceRecord } from '@/lib/types';
import CustomersClient from '@/components/customers/CustomersClient';
import { useFirebase, useUser } from '@/firebase';
import { collection, getDocs, query, collectionGroup } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function CustomersPage() {
  const { firestore, isAuthReady } = useFirebase();
  const [allRecords, setAllRecords] = useState<ServiceRecord[]>([]);
  const [allCustomers, setAllCustomers] = useState<Omit<Customer, 'records'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    if (!firestore || !isAuthReady) return;

    setIsLoading(true);
    try {
      // Fetch all customers
      const custQuery = query(collection(firestore, 'customers'));
      const custSnapshot = await getDocs(custQuery);
      const customersList = custSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Omit<Customer, 'records'>));
      setAllCustomers(customersList);
      
      // Fetch all service records
      const recordsQuery = query(collectionGroup(firestore, 'serviceRecords'));
      const recordsSnapshot = await getDocs(recordsQuery);
      const recordsList = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord));
      setAllRecords(recordsList);

    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [firestore, isAuthReady]);

  const handleDeleteAllData = async () => {
    setIsDeleting(true);
    toast({ title: 'Deleting all data...', description: 'This may take a moment.' });
    try {
        const response = await fetch('/api/delete-all', {
            method: 'POST',
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete data.');
        }

        toast({
            title: 'All Data Deleted',
            description: 'Your customer and job records have been cleared.',
        });
        
        // Refetch data to show empty state
        await fetchData();

    } catch (error) {
        console.error("Error deleting all data:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: 'Error', description: `Failed to delete data. ${errorMessage}`, variant: 'destructive' });
    } finally {
        setIsDeleting(false);
    }
  }


  if (isLoading) {
    return <div>Loading jobs...</div>
  }

  return (
    <>
    <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Customers & Jobs</h1>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Delete All Data
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete ALL customers and service records from your database.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAllData}>
                    Yes, delete everything
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
    <CustomersClient allRecords={allRecords} allCustomers={allCustomers} />
    </>
    );
}
