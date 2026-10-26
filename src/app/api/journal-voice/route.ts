import { NextResponse } from 'next/server';
import { transcribeJournalAudioWithGemini } from '@/server/gemini';
import type { JournalFramework } from '@/shared/lib/journalVoice';

const FRAMEWORKS: JournalFramework[] = ['HEAR', 'SOAP', 'Free Write'];

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const audio = body?.audio;
  const mimeType = typeof body?.mimeType === 'string' ? body.mimeType : 'audio/webm';
  const framework = body?.framework as JournalFramework;

  if (typeof audio !== 'string' || !audio || !FRAMEWORKS.includes(framework)) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const result = await transcribeJournalAudioWithGemini(audio, mimeType, framework);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Gemini audio transcription failed:', error);
    return NextResponse.json({ error: 'Transcription failed.' }, { status: 502 });
  }
}
