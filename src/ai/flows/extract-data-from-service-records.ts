
'use server';

/**
 * @fileOverview Extracts data from service records using OCR and a language model.
 *
 * - extractDataFromServiceRecord - A function that handles the data extraction process.
 * - ExtractDataFromServiceRecordInput - The input type for the extractDataFromServiceRecord function.
 * - ExtractDataFromServiceRecordOutput - The return type for the extractDataFromServiceRecord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractDataFromServiceRecordInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      'The service record document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'  
    ),
});
export type ExtractDataFromServiceRecordInput = z.infer<
  typeof ExtractDataFromServiceRecordInputSchema
>;

const ExtractDataFromServiceRecordOutputSchema = z.object({
  date: z.string().describe('The date of the service record.'),
  technician: z.string().describe('The name of the technician.'),
  customer: z.string().describe('The name of the customer.'),
  address: z.string().describe('The address of the customer.'),
  phone: z.string().describe('The phone number of the customer.'),
  model: z.string().describe('The model of the equipment serviced.'),
  serial: z.string().describe('The serial number of the equipment serviced.'),
  filterSize: z.string().describe('The size of the filter used.'),
  freonType: z.string().describe('The type of freon used.'),
  laborHours: z.string().describe('The number of labor hours.'),
  breakdown: z.string().describe('A breakdown of the costs (parts, labor, fees, etc.).'),
  descriptionOfWork: z.string().describe('The description of the work performed.'),
  totalCost: z.string().describe('The total cost of the service.'),
  status: z.string().describe('The status of the service record.'),
});
export type ExtractDataFromServiceRecordOutput = z.infer<
  typeof ExtractDataFromServiceRecordOutputSchema
>;

export async function extractDataFromServiceRecord(
  input: ExtractDataFromServiceRecordInput
): Promise<ExtractDataFromServiceRecordOutput> {
  return extractDataFromServiceRecordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractDataFromServiceRecordPrompt',
  input: {schema: ExtractDataFromServiceRecordInputSchema},
  output: {schema: ExtractDataFromServiceRecordOutputSchema},
  prompt: `You are an expert data extractor. Extract the following information from the service record. If a field is not present, return 'N/A'.

Document:
{{media url=documentDataUri}}`,
});

const extractDataFromServiceRecordFlow = ai.defineFlow(
  {
    name: 'extractDataFromServiceRecordFlow',
    inputSchema: ExtractDataFromServiceRecordInputSchema,
    outputSchema: ExtractDataFromServiceRecordOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
