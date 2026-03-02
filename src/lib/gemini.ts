import { GoogleGenAI } from '@google/genai';
import { applyTranscriptToJournalFields, type JournalFields, type JournalFramework } from './journalVoice';

export interface PersonalizedPlan {
  planName: string;
  planDescription: string;
  welcomeMessage: string;
  day1Passage: string;
}

interface PlanInput {
  name: string;
  purpose: string;
  experience: string;
  interests: string[];
}

function getGeminiApiKey(): string | undefined {
  const viteKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const runtimeKey = (globalThis as any)?.process?.env?.GEMINI_API_KEY as string | undefined;
  return viteKey || runtimeKey;
}

// Fallback mapping mirroring Onboarding.tsx INTEREST_OPTIONS
const FALLBACK_PLANS: Record<string, PersonalizedPlan> = {
  "Who is Jesus?": {
    planName: "The Story of Jesus",
    planDescription: "A 7-day journey through the life, words, and resurrection of Jesus Christ.",
    welcomeMessage: "Your plan is ready!",
    day1Passage: "John 1:1-18",
  },
  "Prayer": {
    planName: "Learning to Talk to God",
    planDescription: "7 days of scripture and reflection to build a real prayer life.",
    welcomeMessage: "Your plan is ready!",
    day1Passage: "Matthew 6:5-15",
  },
  "Peace & Comfort": {
    planName: "Held by Peace",
    planDescription: "7 passages for when life feels overwhelming. You are not alone.",
    welcomeMessage: "Your plan is ready!",
    day1Passage: "Psalm 23",
  },
  "God's Purpose": {
    planName: "Made with Purpose",
    planDescription: "Explore who God says you are and why you are here.",
    welcomeMessage: "Your plan is ready!",
    day1Passage: "Jeremiah 29:11-14",
  },
  "Love & Family": {
    planName: "Love as Scripture Defines It",
    planDescription: "7 days exploring what the Bible says about love, commitment, and family.",
    welcomeMessage: "Your plan is ready!",
    day1Passage: "1 Corinthians 13",
  },
  "Overcoming Fear": {
    planName: "Fear Not",
    planDescription: "7 powerful scriptures for anxiety, fear, and uncertainty.",
    welcomeMessage: "Your plan is ready!",
    day1Passage: "Isaiah 41:10",
  },
};

function getFallbackPlan(interests: string[]): PersonalizedPlan {
  for (const interest of interests) {
    if (FALLBACK_PLANS[interest]) {
      return FALLBACK_PLANS[interest];
    }
  }
  return FALLBACK_PLANS["Who is Jesus?"];
}

export async function generatePersonalizedPlan(input: PlanInput): Promise<PersonalizedPlan> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    console.warn('Gemini API key not set, using fallback plan');
    return getFallbackPlan(input.interests);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a Bible study advisor. Based on the following user profile, create a personalised Bible reading plan.

User profile:
- Name: ${input.name}
- Purpose: ${input.purpose}
- Experience level: ${input.experience}
- Topics of interest: ${input.interests.join(', ')}

Return ONLY a valid JSON object with these exact keys:
{
  "planName": "A short, meaningful reading plan title (not generic, 3-6 words)",
  "planDescription": "1-2 sentence description tailored to this user's purpose and interests",
  "welcomeMessage": "A warm, personal greeting using the user's name (1 sentence)",
  "day1Passage": "A specific Bible passage reference for day 1 (e.g. 'John 3:1-16')"
}

Do not include any text outside the JSON object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        maxOutputTokens: 300,
      },
    });

    const text = response.text?.trim() || '';
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleaned);

    // Validate all required fields exist
    if (!parsed.planName || !parsed.planDescription || !parsed.welcomeMessage || !parsed.day1Passage) {
      throw new Error('Missing required fields in AI response');
    }

    return {
      planName: parsed.planName,
      planDescription: parsed.planDescription,
      welcomeMessage: parsed.welcomeMessage,
      day1Passage: parsed.day1Passage,
    };
  } catch (error) {
    console.error('Gemini API error, using fallback plan:', error);
    return getFallbackPlan(input.interests);
  }
}

export interface GeminiJournalVoiceResult {
  transcript: string;
  fields: JournalFields;
}

function getGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
}

function safeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
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

function buildJournalVoicePrompt(framework: JournalFramework): string {
  const frameworkNote =
    framework === 'HEAR'
      ? 'HEAR sections: f1=Highlight, f2=Explain, f3=Apply, f4=Respond.'
      : framework === 'SOAP'
        ? 'SOAP sections: f1=Scripture, f2=Observation, f3=Application, f4=Prayer.'
        : 'Free Write: put everything in f1 and keep f2/f3/f4 empty.';

  return `You are processing a spoken Christian journal reflection.

Tasks:
1) Transcribe the audio accurately.
2) Populate journal fields according to the selected framework.
3) Keep wording faithful to the speaker. Do not add theology not present in the audio.

Framework:
${framework}
${frameworkNote}

Return ONLY valid JSON with this exact shape:
{
  "transcript": "full transcript text",
  "fields": {
    "f1": "text",
    "f2": "text",
    "f3": "text",
    "f4": "text"
  }
}`;
}

function normalizeGeminiFields(framework: JournalFramework, transcript: string, parsedFields: Partial<JournalFields> | null): JournalFields {
  const base: JournalFields = { f1: '', f2: '', f3: '', f4: '' };

  if (parsedFields) {
    const merged: JournalFields = {
      f1: safeText(parsedFields.f1),
      f2: safeText(parsedFields.f2),
      f3: safeText(parsedFields.f3),
      f4: safeText(parsedFields.f4)
    };
    if (merged.f1 || merged.f2 || merged.f3 || merged.f4) {
      return merged;
    }
  }

  return applyTranscriptToJournalFields(framework, transcript, base);
}

export async function transcribeJournalAudioWithGemini(
  audioBlob: Blob,
  framework: JournalFramework
): Promise<GeminiJournalVoiceResult> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('Gemini API key is not configured.');
  }

  const base64Audio = await blobToBase64(audioBlob);
  const mimeType = audioBlob.type || 'audio/webm';
  const prompt = buildJournalVoicePrompt(framework);

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash-exp'];
  let lastError: unknown = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Audio } }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 1200
        }
      });

      const raw = stripCodeFences(response.text?.trim() || '');
      const parsed = JSON.parse(raw);
      const transcript = safeText(parsed?.transcript);

      if (!transcript) {
        throw new Error('Gemini response missing transcript.');
      }

      const fields = normalizeGeminiFields(framework, transcript, parsed?.fields ?? null);
      return { transcript, fields };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Gemini audio transcription failed.');
}
