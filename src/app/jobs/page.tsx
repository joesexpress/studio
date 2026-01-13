'use client';

import { useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Todo, CalendarEvent } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TodoList from '@/components/jobs/TodoList';
import JobCalendar from '@/components/jobs/JobCalendar';

export default function JobsPage() {
  const { firestore, user } = useFirebase();

  const todosQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'technicians', user.uid, 'todos'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: todos, isLoading: isLoadingTodos } = useCollection<Todo>(todosQuery);

  const calendarEventsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'technicians', user.uid, 'calendarEvents'));
  }, [firestore, user]);

  const { data: calendarEvents, isLoading: isLoadingEvents } = useCollection<CalendarEvent>(calendarEventsQuery);

  const events = useMemo(() => {
    if (!calendarEvents) return [];
    return calendarEvents.map(event => ({
      ...event,
      start: (event.start as any).toDate(),
      end: (event.end as any).toDate(),
    }));
  }, [calendarEvents]);

  if (isLoadingTodos || isLoadingEvents) {
    return <div>Loading jobs...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">Manage your tasks and schedule.</p>
        </div>
      </div>
      <Tabs defaultValue="calendar" className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="todo">To-Do List</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="flex-grow mt-4">
          <JobCalendar initialEvents={events} />
        </TabsContent>
        <TabsContent value="todo" className="mt-4">
          <TodoList initialTodos={todos || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
