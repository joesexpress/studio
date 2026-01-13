
'use client';

import OrderListClient from '@/components/orders/OrderListClient';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function OrdersPage() {
    const { firestore, user } = useFirebase();

    const itemsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        // Assuming a single shopping list for the company, stored under a generic owner for simplicity
        // A better approach would be a dedicated top-level `shoppingLists` collection.
        // For now, we'll store it under the first mock technician.
        return collection(firestore, 'technicians', 'tech-jake', 'shoppingList');
    }, [firestore, user]);

    const { data: initialItems, isLoading } = useCollection(itemsQuery);

    if (isLoading) {
        return <div>Loading shopping list...</div>
    }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shopping List</h1>
          <p className="text-muted-foreground">Manage your parts and materials shopping list.</p>
        </div>
      </div>
      <OrderListClient initialItems={initialItems || []} />
    </>
  );
}
