
'use client';

import OrderListClient from '@/components/orders/OrderListClient';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function OrdersPage() {
    const { firestore } = useFirebase();

    const itemsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // As in orders/page.tsx, we are using a shared list under a generic technician
        return collection(firestore, 'technicians', 'tech-jake', 'shoppingList');
    }, [firestore]);

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
