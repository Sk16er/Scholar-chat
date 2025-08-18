
import type { Project } from './types';

const ragSystemSource = {
  id: 'src_rag_system',
  name: 'RAG System Design.pdf',
  status: 'indexed' as const,
  content: `Retrieval-Augmented Generation (RAG) is a technique for enhancing the accuracy and reliability of large language models (LLMs) with facts fetched from external sources. It combines a retriever, which finds relevant text passages from a knowledge base, and a generator (the LLM), which synthesizes an answer based on the retrieved information and the user's query. This approach helps to ground the model's responses in factual data, reducing hallucinations and allowing the model to cite its sources. The retrieval step typically uses vector search on a database of text embeddings. The quality of the RAG system depends on the quality of the document chunks and the effectiveness of the retriever.`,
  page: 1,
};

const llmAdvancementsSource = {
  id: 'src_llm_advancements',
  name: 'LLM Advancements 2023.txt',
  status: 'indexed' as const,
  content: `The year 2023 saw significant advancements in Large Language Models. Model sizes continued to grow, but the focus shifted towards improving efficiency and reasoning capabilities. Techniques like Mixture-of-Experts (MoE) allowed for larger models that were computationally cheaper to run during inference. Additionally, fine-tuning methods became more sophisticated, with approaches like Reinforcement Learning from Human Feedback (RLHF) and Direct Preference Optimization (DPO) leading to models that are better aligned with human intent and produce more helpful, less harmful responses. The open-source community also flourished, releasing powerful models that rivaled their closed-source counterparts.`,
  page: 1,
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    name: 'AI Research Analysis',
    sources: [ragSystemSource, llmAdvancementsSource],
    summary: 'This project contains documents about Retrieval-Augmented Generation (RAG) systems and recent advancements in Large Language Models (LLMs) from 2023. Key topics include RAG architecture, model efficiency improvements like MoE, and advanced fine-tuning techniques such as RLHF and DPO.',
    conversations: [
      {
        id: 'conv_1',
        messages: [
          {
            role: 'assistant',
            text: 'I am ready to answer questions about your documents on AI Research.',
          },
        ],
      },
    ],
    mindMap: null,
    audioOverview: null,
  },
  {
    id: 'proj_2',
    name: 'Empty Project',
    sources: [],
    summary: 'No summary generated yet. Add sources to get started.',
    conversations: [
      {
        id: 'conv_2',
        messages: [],
      },
    ],
    mindMap: null,
    audioOverview: null,
  },
];
