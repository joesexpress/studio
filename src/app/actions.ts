"use server";

import { revalidatePath } from "next/cache";
import { extractDataFromServiceRecord } from "@/ai/flows/extract-data-from-service-records";
import { summarizeServiceRecord } from "@/ai/flows/summarize-service-records";
import { z } from "zod";
import { doc, serverTimestamp, collection } from 'firebase/firestore';
import { initializeFirebase, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import type { ServiceRecord } from '@/lib/types';
import { getAuth } from 'firebase/auth';

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

  try {
    const extractedData = await extractDataFromServiceRecord({ documentDataUri: fileDataUri });
    const summaryData = await summarizeServiceRecord({ recordText: extractedData.descriptionOfWork });

    const total = parseFloat(extractedData.totalCost.replace(/[^0-9.-]+/g,"")) || 0;
    const recordId = `rec-${Date.now()}`;
    const customerId = `cust-${extractedData.customer.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

    const newRecord: Omit<ServiceRecord, 'date'> & { date: any } = {
      id: recordId,
      customer: extractedData.customer,
      technician: extractedData.technician,
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
