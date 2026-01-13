
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/server';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import type { Customer, ServiceRecord } from '@/lib/types';
import { MOCK_TECHNICIANS } from '@/lib/mock-data';

export async function POST(request: Request) {
  const { firestore } = initializeFirebase();
  if (!firestore) {
    return NextResponse.json({ error: 'Firestore is not initialized.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { name, address, phone, jobDescription, technicianId } = body;

    // Basic validation
    if (!name || !address || !phone || !jobDescription || !technicianId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const technician = MOCK_TECHNICIANS.find(t => t.id === technicianId);
    if (!technician) {
        return NextResponse.json({ error: 'Invalid technician ID.' }, { status: 400 });
    }
    
    const customerId = `cust-${name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;
    const recordId = `rec-${Date.now()}`;

    const customerData: Partial<Customer> = {
      id: customerId,
      name,
      address,
      phone,
    };

    const recordData: Omit<ServiceRecord, 'date' | 'id'> & { date: any } = {
      date: new Date(),
      technician: technician.name,
      customer: name,
      address,
      phone,
      model: 'N/A',
      serial: 'N/A',
      filterSize: 'N/A',
      freonType: 'N/A',
      laborHours: 'N/A',
      breakdown: 'N/A',
      description: jobDescription,
      total: 0,
      status: 'Scheduled',
      fileUrl: '#',
      summary: 'New job scheduled.',
      technicianId,
      customerId,
    };

    const customerRef = doc(firestore, 'customers', customerId);
    await setDoc(customerRef, customerData, { merge: true });

    const customerRecordRef = collection(firestore, 'customers', customerId, 'serviceRecords');
    const newRecordRef = await addDoc(customerRecordRef, recordData);

    return NextResponse.json({ message: 'Customer and job created successfully', customerId, recordId: newRecordRef.id }, { status: 201 });

  } catch (error) {
    console.error('Error creating customer and job:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to create customer and job.', details: errorMessage }, { status: 500 });
  }
}
