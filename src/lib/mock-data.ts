
import type { ServiceRecord, Customer, Technician, Todo, CalendarEvent, Expense, PriceBookEntry } from './types';

export const MOCK_TECHNICIANS: Technician[] = [
  { id: 'tech-jake', name: 'Jake', email: 'jake@kdhvac.com', phone: '555-1111' },
  { id: 'tech-phil', name: 'Phil', email: 'phil@kdhvac.com', phone: '555-2222' },
  { id: 'tech-derek', name: 'Derek', email: 'derek@kdhvac.com', phone: '555-3333' },
];

export const MOCK_RECORDS: ServiceRecord[] = [
  {
    id: 'rec-1',
    date: '2023-10-26T10:00:00Z',
    technician: 'Jake',
    customer: 'Alice Martin',
    address: '123 Maple St, Anytown, USA',
    phone: '555-1234',
    model: 'Carrier-24ABC',
    serial: 'SN-112233',
    filterSize: '16x25x1',
    freonType: 'R-410A',
    laborHours: '2',
    breakdown: 'Labor: $150, Parts: $75',
    description: 'Performed annual maintenance. Cleaned coils, checked refrigerant levels, and replaced filter.',
    total: 225.00,
    status: 'Paid',
    fileUrl: '#',
    summary: 'Annual maintenance check including coil cleaning and filter replacement.',
    technicianId: 'tech-jake',
    customerId: 'cust-alice-martin',
  },
  {
    id: 'rec-2',
    date: '2023-10-25T14:30:00Z',
    technician: 'Phil',
    customer: 'Bob Johnson',
    address: '456 Oak Ave, Anytown, USA',
    phone: '555-5678',
    model: 'Trane-XL18i',
    serial: 'SN-445566',
    filterSize: '20x25x5',
    freonType: 'R-410A',
    laborHours: '3.5',
    breakdown: 'Labor: $262.50, Parts: $350 (Compressor)',
    description: 'Diagnosed no-cool call. Found failed compressor. Replaced compressor, evacuated and recharged system.',
    total: 612.50,
    status: 'Owed',
    fileUrl: '#',
    summary: 'Replaced a failed compressor and recharged the AC system.',
    technicianId: 'tech-phil',
    customerId: 'cust-bob-johnson',
  },
    {
    id: 'rec-3',
    date: '2023-09-15T09:00:00Z',
    technician: 'Derek',
    customer: 'Charlie Brown',
    address: '789 Pine Ln, Anytown, USA',
    phone: '555-9876',
    model: 'Lennox-XC25',
    serial: 'SN-778899',
    filterSize: '16x20x1',
    freonType: 'R-410A',
    laborHours: '1',
    breakdown: 'Labor: $100 (Service Call Fee)',
    description: 'Customer requested estimate for a new system install. Provided quote for a 3-ton unit.',
    total: 3500.00,
    status: 'Estimate',
    fileUrl: '#',
    summary: 'Provided an estimate for a complete new HVAC system installation.',
    technicianId: 'tech-derek',
    customerId: 'cust-charlie-brown',
  },
];

export const MOCK_CUSTOMERS: Customer[] = [
    {
        id: 'cust-alice-martin',
        name: 'Alice Martin',
        address: '123 Maple St, Anytown, USA',
        phone: '555-1234',
        totalJobs: 1,
        totalBilled: 225.00,
        records: [MOCK_RECORDS[0]],
    },
    {
        id: 'cust-bob-johnson',
        name: 'Bob Johnson',
        address: '456 Oak Ave, Anytown, USA',
        phone: '555-5678',
        totalJobs: 1,
        totalBilled: 612.50,
        records: [MOCK_RECORDS[1]],
    },
    {
        id: 'cust-charlie-brown',
        name: 'Charlie Brown',
        address: '789 Pine Ln, Anytown, USA',
        phone: '555-9876',
        totalJobs: 1,
        totalBilled: 0,
        records: [MOCK_RECORDS[2]],
    }
];

export const MOCK_TODOS: Todo[] = [
    { id: 'todo-1', task: 'Pick up filters from supplier', isCompleted: false, createdAt: new Date() as any, technicianId: 'tech-jake'},
    { id: 'todo-2', task: 'Call back Mrs. Higgins about estimate', isCompleted: false, createdAt: new Date() as any, technicianId: 'tech-jake'},
    { id: 'todo-3', task: 'Organize van stock', isCompleted: true, createdAt: new Date() as any, technicianId: 'tech-jake'},
];

export const MOCK_EVENTS: CalendarEvent[] = [
    { id: 'event-1', title: 'Service for Alice Martin', start: new Date(2023, 9, 26, 10, 0), end: new Date(2023, 9, 26, 12, 0), technicianId: 'tech-jake' },
    { id: 'event-2', title: 'Install for Bob Johnson', start: new Date(2023, 9, 25, 14, 30), end: new Date(2023, 9, 25, 18, 0), technicianId: 'tech-phil' },
];

export const MOCK_EXPENSES: Expense[] = [
    { id: 'exp-1', date: '2023-10-25T12:00:00Z', technicianId: 'tech-jake', amount: 350.00, description: 'Compressor for job #rec-2', vendor: 'AC Parts Direct', receiptUrl: '#'},
    { id: 'exp-2', date: '2023-10-20T08:30:00Z', technicianId: 'tech-jake', amount: 55.75, description: 'Assorted filters and cleaning supplies', vendor: 'Home Depot', receiptUrl: '#'},
];

export const MOCK_PRICE_BOOK: PriceBookEntry[] = [
    { id: 'pb-1', fileName: '2023_Fall_Pricing_Sheet.pdf', fileUrl: '#', uploadedAt: new Date() as any, technicianId: 'tech-jake' },
    { id: 'pb-2', fileName: 'Carrier_Install_Estimates.xlsx', fileUrl: '#', uploadedAt: new Date() as any, technicianId: 'tech-jake' },
];
