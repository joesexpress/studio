
'use client';

import OrderListClient from '@/components/orders/OrderListClient';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { OrderItem } from '@/lib/types';
import { useState, useEffect } from 'react';

export default function OrdersPage() {
    const { firestore, user, isUserLoading } = useFirebase();
    const [isLoading, setIsLoading] = useState(true);

    // Using a mock user ID as login is removed.
    const mockUserId = 'tech-jake';

    const itemsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'technicians', mockUserId, 'shoppingList'));
    }, [firestore, user]);

    const { data: initialItems, isLoading: isItemsLoading } = useCollection<OrderItem>(itemsQuery);

    useEffect(() => {
        setIsLoading(isUserLoading || isItemsLoading);
    }, [isUserLoading, isItemsLoading]);


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
