import { config } from 'dotenv';
config();

import '@/ai/flows/generate-document-summary.ts';
import '@/ai/flows/answer-questions-from-documents.ts';
import '@/ai/flows/generate-mind-map.ts';
import '@/ai/flows/generate-audio-overview.ts';
import '@/ai/flows/extract-text-from-url.ts';
import '@/ai/flows/extract-text-from-file.ts';
