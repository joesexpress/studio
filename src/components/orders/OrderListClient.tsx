
'use client';

import * as React from 'react';
import type { OrderItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export default function OrderListClient({ initialItems }: { initialItems: OrderItem[] }) {
  const [items, setItems] = React.useState(initialItems);
  const [newItemName, setNewItemName] = React.useState('');
  const [newItemQty, setNewItemQty] = React.useState(1);
  const { toast } = useToast();

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      toast({ title: "Item name cannot be empty.", variant: "destructive" });
      return;
    }

    const newItem: OrderItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      quantity: newItemQty,
    };

    setItems(prev => [newItem, ...prev]);
    setNewItemName('');
    setNewItemQty(1);
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Current Shopping List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="e.g., HVAC Capacitor 45+5 MFD"
            className="flex-grow"
          />
           <Input
            type="number"
            value={newItemQty}
            onChange={(e) => setNewItemQty(Number(e.target.value))}
            min="1"
            className="w-20"
          />
          <Button onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-25rem)]">
          <div className="space-y-2">
            {items.length > 0 ? (
              items.map(item => (
                <div key={item.id} className="flex items-center gap-4 group p-2 rounded-md hover:bg-muted/50">
                  <div className="flex-grow">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteItem(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>Your shopping list is empty.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
