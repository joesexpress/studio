
'use client';

import { useMemo } from 'react';
import type { Todo, CalendarEvent } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TodoList from '@/components/jobs/TodoList';
import JobCalendar from '@/components/jobs/JobCalendar';
import { MOCK_TODOS, MOCK_EVENTS } from '@/lib/mock-data';

export default function JobsPage() {
  // Using mock data instead of Firestore
  const todos = MOCK_TODOS;
  const calendarEvents = MOCK_EVENTS;

  const events = useMemo(() => {
    if (!calendarEvents) return [];
    return calendarEvents.map(event => ({
      ...event,
      start: new Date(event.start as Date),
      end: new Date(event.end as Date),
    }));
  }, [calendarEvents]);

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
