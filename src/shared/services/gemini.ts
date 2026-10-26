import type { JournalFields, JournalFramework } from '@/shared/lib/journalVoice';

export interface PersonalizedPlan {
  planName: string;
  planDescription: string;
  welcomeMessage: string;
  day1Passage: string;
}

export interface PlanInput {
  name: string;
  purpose: string;
  experience: string;
  interests: string[];
}

export interface GeminiJournalVoiceResult {
  transcript: string;
  fields: JournalFields;
}

// True when GEMINI_API_KEY is set on the server (inlined at build time by next.config.ts).
export const isGeminiEnabled = process.env.NEXT_PUBLIC_GEMINI_ENABLED === 'true';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request to ${url} failed with ${res.status}`);
  }
  return data as T;
}

async function blobToBase64(audio: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Unable to read audio blob.'));
        return;
      }
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Failed to encode audio to base64.'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('FileReader failed while encoding audio.'));
    reader.readAsDataURL(audio);
  });
}

export function generatePersonalizedPlan(input: PlanInput): Promise<PersonalizedPlan> {
  return postJson<PersonalizedPlan>('/api/plan', input);
}

export async function transcribeJournalAudioWithGemini(
  audioBlob: Blob,
  framework: JournalFramework
): Promise<GeminiJournalVoiceResult> {
  const audio = await blobToBase64(audioBlob);
  return postJson<GeminiJournalVoiceResult>('/api/journal-voice', {
    audio,
    mimeType: audioBlob.type || 'audio/webm',
    framework,
  });
}
