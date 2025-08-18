'use server';

/**
 * @fileOverview A flow for generating an audio overview from text.
 *
 * - generateAudioOverview - A function that converts text to speech.
 * - GenerateAudioOverviewInput - The input type for the generateAudioOverview function.
 * - GenerateAudioOverviewOutput - The return type for the generateAudioOverview function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';

export const GenerateAudioOverviewInputSchema = z.string();
export type GenerateAudioOverviewInput = z.infer<typeof GenerateAudioOverviewInputSchema>;

export const GenerateAudioOverviewOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio as a data URI.'),
});
export type GenerateAudioOverviewOutput = z.infer<typeof GenerateAudioOverviewOutputSchema>;

export async function generateAudioOverview(
  input: GenerateAudioOverviewInput
): Promise<GenerateAudioOverviewOutput> {
  return generateAudioOverviewFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateAudioOverviewFlow = ai.defineFlow(
  {
    name: 'generateAudioOverviewFlow',
    inputSchema: GenerateAudioOverviewInputSchema,
    outputSchema: GenerateAudioOverviewOutputSchema,
  },
  async (prompt) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt,
    });
    if (!media) {
      throw new Error('No media returned from TTS model.');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavBase64 = await toWav(audioBuffer);
    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
