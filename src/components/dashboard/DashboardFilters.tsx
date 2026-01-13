'use client';

import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ServiceRecordStatus } from '@/lib/types';
import { Card } from '../ui/card';

type DashboardFiltersProps = {
  filters: {
    dateRange: DateRange | undefined;
    technician: string;
    status: string;
  };
  onFiltersChange: (filters: {
    dateRange: DateRange | undefined;
    technician: string;
    status: string;
  }) => void;
  technicians: string[];
};

export default function DashboardFilters({ filters, onFiltersChange, technicians }: DashboardFiltersProps) {
  const handleDateChange = (dateRange: DateRange | undefined) => {
    onFiltersChange({ ...filters, dateRange });
  };

  const handleTechnicianChange = (technician: string) => {
    onFiltersChange({ ...filters, technician });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status });
  };
  
  const handleClearFilters = () => {
    onFiltersChange({ dateRange: undefined, technician: '', status: '' });
  }

  const statuses: ServiceRecordStatus[] = ['Paid', 'Owed', 'Estimate', 'No Charge'];

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className="w-[300px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange?.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, 'LLL dd, y')} -{' '}
                    {format(filters.dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(filters.dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={filters.dateRange?.from}
              selected={filters.dateRange}
              onSelect={handleDateChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Select value={filters.technician} onValueChange={handleTechnicianChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Technicians" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Technicians</SelectItem>
            {technicians.map(tech => (
              <SelectItem key={tech} value={tech}>{tech}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button variant="ghost" onClick={handleClearFilters} className="text-muted-foreground">
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      </div>
    </Card>
  );
}
