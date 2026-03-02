import { GoogleGenAI } from '@google/genai';

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
  // @ts-ignore
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('VITE_GEMINI_API_KEY not set, using fallback plan');
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
      model: 'gemini-2.0-flash',
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
