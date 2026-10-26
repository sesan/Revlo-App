import { NextResponse } from 'next/server';
import { generatePersonalizedPlan } from '@/server/gemini';
import type { PlanInput } from '@/shared/services/gemini';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<PlanInput> | null;

  const input: PlanInput = {
    name: typeof body?.name === 'string' ? body.name : '',
    purpose: typeof body?.purpose === 'string' ? body.purpose : '',
    experience: typeof body?.experience === 'string' ? body.experience : '',
    interests: Array.isArray(body?.interests) ? body.interests.filter((i): i is string => typeof i === 'string') : [],
  };

  // generatePersonalizedPlan never throws: it falls back to a static plan.
  const plan = await generatePersonalizedPlan(input);
  return NextResponse.json(plan);
}
