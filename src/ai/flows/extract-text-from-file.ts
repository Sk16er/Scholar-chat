'use server';
/**
 * @fileOverview A flow for extracting text content from a given file data URI.
 *
 * - extractTextFromFile - A function that takes a data URI and returns the text content.
 * - ExtractTextFromFileInput - The input type for the extractTextFromFile function.
 * - ExtractTextFromFileOutput - The return type for the extractTextFromFile function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractTextFromFileInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTextFromFileInput = z.infer<
  typeof ExtractTextFromFileInputSchema
>;

const ExtractTextFromFileOutputSchema = z.object({
  content: z.string().describe('The extracted text content from the file.'),
});
export type ExtractTextFromFileOutput = z.infer<
  typeof ExtractTextFromFileOutputSchema
>;

export async function extractTextFromFile(
  input: ExtractTextFromFileInput
): Promise<ExtractTextFromFileOutput> {
  return extractTextFromFileFlow(input);
}

const extractTextFromFileFlow = ai.defineFlow(
  {
    name: 'extractTextFromFileFlow',
    inputSchema: ExtractTextFromFileInputSchema,
    outputSchema: ExtractTextFromFileOutputSchema,
  },
  async ({ fileDataUri }) => {
    try {
      const { output } = await ai.generate({
        prompt: [
          {
            text: 'Extract the text content from the following file.',
          },
          { media: { url: fileDataUri } },
        ],
        output: {
          schema: ExtractTextFromFileOutputSchema,
        },
      });
      return output!;
    } catch (e) {
      console.error(e);
      return {
        content: 'I am unable to process this file.',
      };
    }
  }
);
