"use server";

import { revalidatePath } from "next/cache";
import { extractDataFromServiceRecord } from "@/ai/flows/extract-data-from-service-records";
import { summarizeServiceRecord } from "@/ai/flows/summarize-service-records";
import { z } from "zod";
import { doc, serverTimestamp, collection } from 'firebase/firestore';
import { initializeFirebase, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import type { ServiceRecord, Customer, Technician } from '@/lib/types';
import { getAuth } from 'firebase/auth';
import { MOCK_TECHNICIANS } from '@/lib/mock-data';

const fileSchema = z.object({
  fileDataUri: z.string().refine(val => val.startsWith('data:'), {
    message: 'File data must be a valid data URI',
  }),
});

export async function processServiceRecord(formData: FormData) {
  const rawFormData = {
    fileDataUri: formData.get('file'),
    technicianId: formData.get('technicianId'),
  };

  const validation = fileSchema.extend({
      technicianId: z.string().min(1, { message: "Technician ID is required." })
  }).safeParse(rawFormData);
  
  if (!validation.success) {
    return { success: false, error: "Invalid form data." };
  }
  
  const { fileDataUri, technicianId } = validation.data;
  const technicianName = MOCK_TECHNICIANS.find(t => t.id === technicianId)?.name || 'N/A';

  try {
    const extractedData = await extractDataFromServiceRecord({ documentDataUri: fileDataUri });
    const summaryData = await summarizeServiceRecord({ recordText: extractedData.descriptionOfWork });

    const total = parseFloat(extractedData.totalCost.replace(/[^0-9.-]+/g,"")) || 0;
    const recordId = `rec-${Date.now()}`;
    const customerId = `cust-${extractedData.customer.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

    const newRecord: Omit<ServiceRecord, 'date'> & { date: any } = {
      id: recordId,
      customer: extractedData.customer,
      technician: technicianName,
      date: serverTimestamp(),
      summary: summaryData.summary,
      address: extractedData.address,
      phone: extractedData.phone,
      model: extractedData.model,
      serial: extractedData.serial,
      filterSize: extractedData.filterSize,
      freonType: extractedData.freonType,
      laborHours: extractedData.laborHours,
      breakdown: extractedData.breakdown,
      description: extractedData.descriptionOfWork,
      total: total,
      fileUrl: '#', // Placeholder, you might want to upload the file to Firebase Storage
      technicianId: technicianId,
      customerId: customerId,
      status: (extractedData.status as any) || 'N/A'
    };
    
    const { firestore } = initializeFirebase();

    // Save to technician's subcollection
    const techRecordRef = doc(firestore, 'technicians', technicianId, 'serviceRecords', recordId);
    setDocumentNonBlocking(techRecordRef, newRecord, {});

    // Save to customer's subcollection
    const customerRecordRef = doc(firestore, 'customers', customerId, 'serviceRecords', recordId);
    setDocumentNonBlocking(customerRecordRef, newRecord, {});

    // Also save/update the main customer profile
    const customerDocRef = doc(firestore, 'customers', customerId);
    setDocumentNonBlocking(customerDocRef, {
      id: customerId,
      name: extractedData.customer,
      address: extractedData.address,
      phone: extractedData.phone,
    }, { merge: true });

    // Since we're not awaiting, we can't be 100% sure the write is done before revalidation.
    // For optimistic UI, this is generally okay.
    revalidatePath("/records");
    revalidatePath("/customers");
    revalidatePath("/dashboard");

    return { success: true, record: { ...newRecord, date: new Date().toISOString() } }; // Return with a serializable date
  } catch (error) {
    console.error("Error processing service record:", error);
    return { success: false, error: "Failed to process service record using AI." };
  }
}


const addCustomerSchema = z.object({
  name: z.string().min(1, { message: "Customer name is required." }),
  address: z.string().min(1, { message: "Address is required." }),
  phone: z.string().min(1, { message: "Phone number is required." }),
  jobDescription: z.string().min(1, { message: "Job description is required." }),
  technicianId: z.string().min(1, { message: "Technician ID is required." }),
});


export async function addCustomerAndJob(formData: FormData) {
  const rawFormData = {
    name: formData.get('name'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    jobDescription: formData.get('jobDescription'),
    technicianId: formData.get('technicianId'),
  };

  const validation = addCustomerSchema.safeParse(rawFormData);
  if (!validation.success) {
    return { success: false, error: "Invalid form data." };
  }

  const { name, address, phone, jobDescription, technicianId } = validation.data;
  const { firestore } = initializeFirebase();
  const technicianName = MOCK_TECHNICIANS.find(t => t.id === technicianId)?.name || 'N/A';

  const customerId = `cust-${name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;
  const recordId = `rec-${Date.now()}`;

  const customerData: Partial<Customer> = {
    id: customerId,
    name,
    address,
    phone,
  };

  const recordData: Omit<ServiceRecord, 'date'> & { date: any } = {
    id: recordId,
    date: serverTimestamp(),
    technician: technicianName,
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

  try {
    // Save customer profile
    const customerRef = doc(firestore, 'customers', customerId);
    setDocumentNonBlocking(customerRef, customerData, { merge: true });

    // Save service record to technician's subcollection
    const techRecordRef = doc(firestore, 'technicians', technicianId, 'serviceRecords', recordId);
    setDocumentNonBlocking(techRecordRef, recordData, {});

    // Save service record to customer's subcollection
    const customerRecordRef = doc(firestore, 'customers', customerId, 'serviceRecords', recordId);
    setDocumentNonBlocking(customerRecordRef, recordData, {});
    
    revalidatePath('/customers');
    revalidatePath('/records');

    return { success: true, customerId, recordId };
  } catch (error) {
    console.error("Error creating customer and job:", error);
    return { success: false, error: "Failed to save new customer and job." };
  }
}
