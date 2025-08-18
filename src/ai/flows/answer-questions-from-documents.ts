'use server';

/**
 * @fileOverview A question answering AI agent that answers questions based on uploaded documents.
 *
 * - answerQuestionsFromDocuments - A function that handles the question answering process.
 * - AnswerQuestionsFromDocumentsInput - The input type for the answerQuestionsFromDocuments function.
 * - AnswerQuestionsFromDocumentsOutput - The return type for the answerQuestionsFromDocuments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionsFromDocumentsInputSchema = z.object({
  projectId: z.string().describe('The ID of the project containing the documents.'),
  conversationId: z.string().describe('The ID of the conversation.'),
  userQuery: z.string().describe('The user question.'),
  contextPassages: z.array(
    z.object({
      sourceId: z.string().describe('The ID of the source document.'),
      page: z.number().describe('The page number in the document.'),
      text: z.string().describe('The text content of the passage.'),
    })
  ).describe('The relevant passages retrieved from the documents.'),
});
export type AnswerQuestionsFromDocumentsInput = z.infer<typeof AnswerQuestionsFromDocumentsInputSchema>;

const AnswerQuestionsFromDocumentsOutputSchema = z.object({
  answer: z.string().describe('The answer to the user question, based on the provided documents.'),
  citations: z.array(
    z.object({
      sourceId: z.string().describe('The ID of the source document.'),
      page: z.number().describe('The page number in the document.'),
      snippet: z.string().describe('A snippet from the source document that supports the answer.'),
    })
  ).describe('The sources cited in the answer.'),
});
export type AnswerQuestionsFromDocumentsOutput = z.infer<typeof AnswerQuestionsFromDocumentsOutputSchema>;

export async function answerQuestionsFromDocuments(input: AnswerQuestionsFromDocumentsInput): Promise<AnswerQuestionsFromDocumentsOutput> {
  return answerQuestionsFromDocumentsFlow(input);
}

const ragPrompt = ai.definePrompt({
  name: 'ragPrompt',
  input: {schema: AnswerQuestionsFromDocumentsInputSchema},
  output: {schema: AnswerQuestionsFromDocumentsOutputSchema},
  prompt: `You are an assistant that must answer questions using ONLY the passages provided below. Each passage includes a sourceId and page. Your answer must:\n- Begin with a brief answer (1–2 sentences).\n- Then add \"Sources:\" and list each cited source in form [sourceId:page], with a one-line snippet showing the supporting text.\n- If the information is not present in the sources, reply: \"I can't answer that from the provided documents.\"\n- Do not invent facts or external information.\n\nUser question: {{{userQuery}}}\n\nSOURCES:\n{{#each contextPassages}}
SOURCE:{{sourceId}} PAGE:{{page}}\n{{text}}\n---\n{{/each}}`,
});

const answerQuestionsFromDocumentsFlow = ai.defineFlow(
  {
    name: 'answerQuestionsFromDocumentsFlow',
    inputSchema: AnswerQuestionsFromDocumentsInputSchema,
    outputSchema: AnswerQuestionsFromDocumentsOutputSchema,
  },
  async input => {
    const {output} = await ragPrompt(input);
    return output!;
  }
);
