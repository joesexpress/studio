'use client';

import * as React from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { CalendarEvent } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import AddEventDialog from './AddEventDialog';
import { useFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

const localizer = momentLocalizer(moment);

export default function JobCalendar({ initialEvents }: { initialEvents: CalendarEvent[] }) {
  const [events, setEvents] = React.useState(initialEvents);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const { firestore } = useFirebase();

  // Using a mock user ID as login is removed.
  const mockUserId = 'tech-jake';
  
  React.useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    setIsDialogOpen(true);
  };

  const handleAddEvent = (title: string, description: string) => {
    if (!firestore || !selectedDate) return;
    
    const newEvent = {
        title,
        description,
        start: selectedDate,
        end: moment(selectedDate).add(1, 'hour').toDate(), // Default to 1 hour event
        technicianId: mockUserId,
    };
    
    const calendarEventsColRef = collection(firestore, 'technicians', mockUserId, 'calendarEvents');
    addDocumentNonBlocking(calendarEventsColRef, newEvent);

    setIsDialogOpen(false);
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardContent className="p-0 lg:p-4 flex-grow">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100vh - 18rem)' }}
            selectable
            onSelectSlot={handleSelectSlot}
          />
        </CardContent>
      </Card>
      <AddEventDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAddEvent={handleAddEvent}
        selectedDate={selectedDate}
      />
    </>
  );
}
