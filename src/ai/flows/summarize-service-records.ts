'use server';
/**
 * @fileOverview A service record summarization AI agent.
 *
 * - summarizeServiceRecord - A function that handles the service record summarization process.
 * - SummarizeServiceRecordInput - The input type for the summarizeServiceRecord function.
 * - SummarizeServiceRecordOutput - The return type for the summarizeServiceRecord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeServiceRecordInputSchema = z.object({
  recordText: z.string().describe('The full text of the service record.'),
});
export type SummarizeServiceRecordInput = z.infer<typeof SummarizeServiceRecordInputSchema>;

const SummarizeServiceRecordOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the service record (max 50 words).'),
});
export type SummarizeServiceRecordOutput = z.infer<typeof SummarizeServiceRecordOutputSchema>;

export async function summarizeServiceRecord(input: SummarizeServiceRecordInput): Promise<SummarizeServiceRecordOutput> {
  return summarizeServiceRecordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeServiceRecordPrompt',
  input: {schema: SummarizeServiceRecordInputSchema},
  output: {schema: SummarizeServiceRecordOutputSchema},
  prompt: `You are an AI assistant that summarizes service records.\n\n  Given the following service record text, create a concise summary (max 50 words) highlighting the key services performed, parts replaced, and any issues identified. Focus on the most important aspects of the record.\n
  Service Record:\n  {{{recordText}}}`,
});

const summarizeServiceRecordFlow = ai.defineFlow(
  {
    name: 'summarizeServiceRecordFlow',
    inputSchema: SummarizeServiceRecordInputSchema,
    outputSchema: SummarizeServiceRecordOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
