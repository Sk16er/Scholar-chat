'use server';

/**
 * @fileOverview A flow for generating a mind map from project sources.
 *
 * - generateMindMap - A function that creates a mind map from documents.
 * - GenerateMindMapInput - The input type for the generateMindMap function.
 * - GenerateMindMapOutput - The return type for the generateMindMap function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMindMapInputSchema = z.object({
  sources: z.array(
    z.object({
      id: z.string().describe('The unique identifier for the source document.'),
      name: z.string().describe('The name or title of the source document.'),
      content: z.string().describe('The full text content of the source document.'),
    })
  ).describe('An array of source documents for the project.'),
});
export type GenerateMindMapInput = z.infer<typeof GenerateMindMapInputSchema>;

const GenerateMindMapOutputSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string().describe('Unique ID for the node.'),
      label: z.string().describe('Display label for the node.'),
      type: z.enum(['source', 'concept']).describe('The type of the node.'),
    })
  ).describe('An array of nodes for the mind map graph.'),
  edges: z.array(
    z.object({
      id: z.string().describe('Unique ID for the edge.'),
      from: z.string().describe('The ID of the source node.'),
      to: z.string().describe('The ID of the target node.'),
      label: z.string().optional().describe('An optional label for the edge, describing the relationship.'),
    })
  ).describe('An array of edges connecting the nodes in the mind map.'),
});
export type GenerateMindMapOutput = z.infer<typeof GenerateMindMapOutputSchema>;


export async function generateMindMap(
  input: GenerateMindMapInput
): Promise<GenerateMindMapOutput> {
  return generateMindMapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMindMapPrompt',
  input: { schema: GenerateMindMapInputSchema },
  output: { schema: GenerateMindMapOutputSchema },
  prompt: `You are a research assistant tasked with creating a mind map from a collection of documents.

Your task is to identify the main concepts and themes from the provided sources and represent them as a graph.

Follow these instructions:
1.  Read through all the provided source documents.
2.  Identify the key concepts, topics, and entities discussed. These will be your 'concept' nodes.
3.  Each source document should also be a 'source' node.
4.  Create edges to link concepts to the source documents they are mentioned in.
5.  Create edges between related concepts to show their relationships. You can add a label to the edge to describe the relationship (e.g., "is a type of", "is related to", "is a part of").
6.  Ensure all node and edge IDs are unique. For source nodes, use the provided source ID. For concept nodes, create a concise, descriptive ID. For edges, create an ID like 'from-to-label'.

SOURCES:
{{#each sources}}
---
ID: {{{id}}}
NAME: {{{name}}}
CONTENT: {{{content}}}
---
{{/each}}
`,
});

const generateMindMapFlow = ai.defineFlow(
  {
    name: 'generateMindMapFlow',
    inputSchema: GenerateMindMapInputSchema,
    outputSchema: GenerateMindMapOutputSchema,
  },
  async (input) => {
    if (input.sources.length === 0) {
      return { nodes: [], edges: [] };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
