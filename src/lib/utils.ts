/**
 * Safely parse onboarding answers from JSONB format
 * Returns purpose, experience, and interests array with fallbacks
 */
export function parseOnboardingAnswers(answers: any): {
  purpose: string;
  experience: string;
  interests: string[];
} {
  if (!answers) {
    return {
      purpose: "I want to build a daily reading habit",
      experience: "Complete beginner — I've never really read it",
      interests: ["Who is Jesus?"],
    };
  }

  // Handle array format: [purpose, experience, interests[]]
  if (Array.isArray(answers)) {
    return {
      purpose: answers[0] || "I want to build a daily reading habit",
      experience: answers[1] || "Complete beginner — I've never really read it",
      interests: Array.isArray(answers[2]) ? answers[2] : ["Who is Jesus?"],
    };
  }

  // Handle object format (fallback)
  return {
    purpose: answers.purpose || "I want to build a daily reading habit",
    experience: answers.experience || "Complete beginner — I've never really read it",
    interests: Array.isArray(answers.interests) ? answers.interests : ["Who is Jesus?"],
  };
}
