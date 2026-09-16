import OpenAI from "openai";
import { toFile } from "openai/uploads";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Transcribes an audio recording. gpt-4o-transcribe gives materially better
 * accuracy on long, rambling, pause-filled speech than whisper-1 or the
 * browser's built-in speech recognition.
 */
export async function transcribeAudio(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const file = await toFile(buffer, filename, { type: mimeType });
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "gpt-4o-transcribe",
  });
  return transcription.text;
}
