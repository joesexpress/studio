
"use server";

import { revalidatePath } from "next/cache";
import { extractDataFromServiceRecord } from "@/ai/flows/extract-data-from-service-records";
import { summarizeServiceRecord } from "@/ai/flows/summarize-service-records";

export async function processServiceRecordAI(fileDataUri: string) {
  try {
    const extractedData = await extractDataFromServiceRecord({ documentDataUri: fileDataUri });
    const summaryData = await summarizeServiceRecord({ recordText: extractedData.descriptionOfWork });
    
    return { 
      success: true, 
      data: {
        ...extractedData,
        summary: summaryData.summary
      }
    };
  } catch (error) {
    console.error("Error processing service record with AI:", error);
    return { success: false, error: "Failed to process service record using AI." };
  }
}
