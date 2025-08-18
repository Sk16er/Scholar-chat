'use server';

/**
 * @fileOverview Document summarization flow.
 *
 * - generateDocumentSummary - A function that generates a summary for a given document.
 * - GenerateDocumentSummaryInput - The input type for the generateDocumentSummary function.
 * - GenerateDocumentSummaryOutput - The return type for the generateDocumentSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDocumentSummaryInputSchema = z.object({
  documentText: z.string().describe('The text content of the document to summarize.'),
  documentTitle: z.string().describe('The title of the document.'),
});
export type GenerateDocumentSummaryInput = z.infer<typeof GenerateDocumentSummaryInputSchema>;

const GenerateDocumentSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the document.'),
  progress: z.string().describe('A message indicating the progress of the summarization process.'),
});
export type GenerateDocumentSummaryOutput = z.infer<typeof GenerateDocumentSummaryOutputSchema>;

export async function generateDocumentSummary(input: GenerateDocumentSummaryInput): Promise<GenerateDocumentSummaryOutput> {
  return generateDocumentSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDocumentSummaryPrompt',
  input: {schema: GenerateDocumentSummaryInputSchema},
  output: {schema: GenerateDocumentSummaryOutputSchema},
  prompt: `You are an expert summarizer. Please provide a concise summary of the following document. Be sure to include the key points and main ideas.

Title: {{{documentTitle}}}

Document Text: {{{documentText}}}`,
});

const generateDocumentSummaryFlow = ai.defineFlow(
  {
    name: 'generateDocumentSummaryFlow',
    inputSchema: GenerateDocumentSummaryInputSchema,
    outputSchema: GenerateDocumentSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      ...output!,
      progress: 'Generated a short, one-sentence summary of the document.'
    };
  }
);
