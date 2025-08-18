'use server';
/**
 * @fileOverview A flow for extracting text content from a given URL.
 * This can handle YouTube videos and general web pages.
 *
 * - extractTextFromUrl - A function that takes a URL and returns the text content.
 * - ExtractTextFromUrlInput - The input type for the extractTextFromUrl function.
 * - ExtractTextFromUrlOutput - The return type for the extractFromUrl function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractTextFromUrlInputSchema = z.object({
  url: z.string().url().describe('The URL to extract text from.'),
});
export type ExtractTextFromUrlInput = z.infer<
  typeof ExtractTextFromUrlInputSchema
>;

const ExtractTextFromUrlOutputSchema = z.object({
  name: z.string().describe('The title of the page or video.'),
  content: z
    .string()
    .describe('The extracted text content from the URL.'),
});
export type ExtractTextFromUrlOutput = z.infer<
  typeof ExtractTextFromUrlOutputSchema
>;

export async function extractTextFromUrl(
  input: ExtractTextFromUrlInput
): Promise<ExtractTextFromUrlOutput> {
  return extractTextFromUrlFlow(input);
}

const extractTextFromUrlFlow = ai.defineFlow(
  {
    name: 'extractTextFromUrlFlow',
    inputSchema: ExtractTextFromUrlInputSchema,
    outputSchema: ExtractTextFromUrlOutputSchema,
  },
  async ({ url }) => {
    try {
      const { output } = await ai.generate({
        prompt: `Extract the text content and title from the following URL: ${url}. If it is a video, provide a transcript.`,
        output: {
          schema: ExtractTextFromUrlOutputSchema,
        },
      });
      return output!;
    } catch (e) {
      console.error(e);
      // Return a specific string that the frontend can check for.
      return {
        name: url,
        content: 'I am unable to access this URL.',
      };
    }
  }
);

    