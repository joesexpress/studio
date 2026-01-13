"use server";

import { revalidatePath } from "next/cache";
import { extractDataFromServiceRecord } from "@/ai/flows/extract-data-from-service-records";
import { summarizeServiceRecord } from "@/ai/flows/summarize-service-records";
import { z } from "zod";
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const fileSchema = z.object({
  fileDataUri: z.string().refine(val => val.startsWith('data:'), {
    message: 'File data must be a valid data URI',
  }),
});

async function getUserId(): Promise<string | null> {
  // This is a server-side context, so we can't use hooks.
  // We need to initialize a temporary app instance to get the current user.
  // This is not ideal but necessary in Server Actions.
  try {
    const { auth } = initializeFirebase();
    const user = auth.currentUser;
    return user ? user.uid : null;
  } catch (e) {
    return null; // No user if Firebase isn't initialized
  }
}

export async function processServiceRecord(formData: FormData) {
  const rawFormData = {
    fileDataUri: formData.get('file'),
  };

  const validation = fileSchema.safeParse(rawFormData);
  if (!validation.success) {
    return { success: false, error: "Invalid file data." };
  }
  
  const technicianId = await getUserId();
  if (!technicianId) {
    return { success: false, error: "User not authenticated." };
  }

  try {
    const extractedData = await extractDataFromServiceRecord({ documentDataUri: validation.data.fileDataUri });
    const summaryData = await summarizeServiceRecord({ recordText: extractedData.descriptionOfWork });

    const total = parseFloat(extractedData.totalCost.replace(/[^0-9.-]+/g,"")) || 0;
    const recordId = `rec-${Date.now()}`;
    const customerId = `cust-${extractedData.customer.replace(/\s+/g, '-').toLowerCase()}`;

    const newRecord = {
      id: recordId,
      ...extractedData,
      date: serverTimestamp(),
      summary: summaryData.summary,
      description: extractedData.descriptionOfWork,
      total: total,
      fileUrl: '#', // Placeholder, you might want to upload the file to Firebase Storage
      technicianId: technicianId,
      customerId: customerId,
      status: extractedData.status || 'N/A'
    };
    
    const { firestore } = initializeFirebase();

    // Save to technician's subcollection
    const techRecordRef = collection(firestore, 'technicians', technicianId, 'serviceRecords');
    addDocumentNonBlocking(techRecordRef, newRecord);

    // Save to customer's subcollection
    const customerRecordRef = collection(firestore, 'customers', customerId, 'serviceRecords');
    addDocumentNonBlocking(customerRecordRef, newRecord);

    // Also save/update the main customer profile
    const customerDocRef = doc(firestore, 'customers', customerId);
    setDoc(customerDocRef, {
      id: customerId,
      name: extractedData.customer,
      address: extractedData.address,
      phone: extractedData.phone,
    }, { merge: true });

    revalidatePath("/records");

    return { success: true, record: { ...newRecord, date: new Date().toISOString() } }; // Return with a serializable date
  } catch (error) {
    console.error("Error processing service record:", error);
    return { success: false, error: "Failed to process service record using AI." };
  }
}
