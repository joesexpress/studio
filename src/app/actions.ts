"use server";

import { revalidatePath } from "next/cache";
import { extractDataFromServiceRecord } from "@/ai/flows/extract-data-from-service-records";
import { summarizeServiceRecord } from "@/ai/flows/summarize-service-records";
import { z } from "zod";

const fileSchema = z.object({
  fileDataUri: z.string().refine(val => val.startsWith('data:'), {
    message: 'File data must be a valid data URI',
  }),
});

export async function processServiceRecord(formData: FormData) {
  const rawFormData = {
    fileDataUri: formData.get('file'),
  };

  const validation = fileSchema.safeParse(rawFormData);
  if (!validation.success) {
    return { success: false, error: "Invalid file data." };
  }

  try {
    const extractedData = await extractDataFromServiceRecord({ documentDataUri: validation.data.fileDataUri });
    const summaryData = await summarizeServiceRecord({ recordText: extractedData.descriptionOfWork });

    const total = parseFloat(extractedData.totalCost.replace(/[^0-9.-]+/g,"")) || 0;

    const newRecord = {
      ...extractedData,
      id: `new-${Date.now()}`,
      summary: summaryData.summary,
      description: extractedData.descriptionOfWork,
      total: total,
      fileUrl: '#',
    };
    
    // In a real app, you would save this to a database.
    // For this example, we revalidate the path to show a placeholder for new data.
    revalidatePath("/records");

    return { success: true, record: newRecord };
  } catch (error) {
    console.error("Error processing service record:", error);
    return { success: false, error: "Failed to process service record using AI." };
  }
}
