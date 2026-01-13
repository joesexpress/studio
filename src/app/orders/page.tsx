
'use client';

import OrderListClient from '@/components/orders/OrderListClient';
import { MOCK_ORDER_ITEMS } from '@/lib/mock-data';

export default function OrdersPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shopping List</h1>
          <p className="text-muted-foreground">Manage your parts and materials shopping list.</p>
        </div>
      </div>
      <OrderListClient initialItems={MOCK_ORDER_ITEMS} />
    </>
  );
}
