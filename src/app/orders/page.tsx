
'use client';

import OrderListClient from '@/components/orders/OrderListClient';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { OrderItem } from '@/lib/types';

export default function OrdersPage() {
    const { firestore } = useFirebase();

    // Using a mock user ID as login is removed.
    const mockUserId = 'tech-jake';

    const itemsQuery = useMemoFirebase(() => {
        if (!firestore || !mockUserId) return null;
        return query(collection(firestore, 'technicians', mockUserId, 'shoppingList'));
    }, [firestore, mockUserId]);

    const { data: initialItems, isLoading } = useCollection<OrderItem>(itemsQuery);

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
