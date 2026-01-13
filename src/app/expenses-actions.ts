'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';

const ExpenseSchema = z.object({
  vendor: z.string().describe('The name of the vendor or store.'),
  description: z.string().describe('A brief description of the items purchased.'),
  amount: z.string().describe('The total amount of the expense.'),
});

const fileSchema = z.object({
  fileDataUri: z.string().refine(val => val.startsWith('data:'), {
    message: 'File data must be a valid data URI',
  }),
});

const extractExpensePrompt = ai.definePrompt({
    name: 'extractExpensePrompt',
    input: { schema: fileSchema },
    output: { schema: ExpenseSchema },
    prompt: `You are an expert data extractor specializing in receipts. Extract the vendor, a brief description of what was purchased, and the total amount from the following receipt image.
    
    Receipt: {{media url=fileDataUri}}`,
});

const extractExpenseFlow = ai.defineFlow(
  {
    name: 'extractExpenseFlow',
    inputSchema: fileSchema,
    outputSchema: ExpenseSchema,
  },
  async (input) => {
    const { output } = await extractExpensePrompt(input);
    return output!;
  }
);


export async function processExpenseReceipt(formData: FormData) {
  const rawFormData = {
    fileDataUri: formData.get('fileDataUri'),
  };

  const validation = fileSchema.safeParse(rawFormData);
  
  if (!validation.success) {
    return { success: false, error: "Invalid form data." };
  }

  try {
    const extractedData = await extractExpenseFlow(validation.data);
    return { success: true, data: extractedData };
  } catch (error: any) {
    console.error('Error processing expense receipt:', error);
    return { success: false, error: 'Failed to process receipt with AI.' };
  }
}
