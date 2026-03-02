import { type LucideIcon, Sparkles, Flame, Trophy, Heart, BookOpen, Target } from 'lucide-react';

export interface MotivationalMessage {
  type: 'milestone' | 'reminder' | 'encouragement' | 'greeting';
  icon: LucideIcon;
  message: string;
  actionText?: string;
  actionPath?: string;
}

/**
 * Get a personalized motivational message based on user activity and context
 */
export function getMotivationalMessage(context: {
  purpose: string;
  streak: number;
  hasActivityToday: boolean;
  lastActivityDate: Date | null;
  versesRead?: number;
  highlightsCount?: number;
  notesCount?: number;
}): MotivationalMessage | null {
  const {
    purpose,
    streak,
    hasActivityToday,
    lastActivityDate,
    versesRead = 0,
    highlightsCount = 0,
    notesCount = 0,
  } = context;

  // Priority 1: Streak milestones (only if achieved today)
  if (hasActivityToday && streak > 0) {
    if (streak === 3) {
      return {
        type: 'milestone',
        icon: Flame,
        message: '3-day streak! You're building momentum.',
        actionText: 'Keep going',
        actionPath: '/bible',
      };
    }
    if (streak === 7) {
      return {
        type: 'milestone',
        icon: Trophy,
        message: '7-day streak! One week of consistency.',
        actionText: 'Continue reading',
        actionPath: '/bible',
      };
    }
    if (streak === 14) {
      return {
        type: 'milestone',
        icon: Trophy,
        message: '14-day streak! Two weeks strong.',
      };
    }
    if (streak === 30) {
      return {
        type: 'milestone',
        icon: Trophy,
        message: '30-day streak! A full month of faithfulness.',
      };
    }
  }

  // Priority 2: Back after a break (>2 days since last activity)
  if (lastActivityDate) {
    const daysSinceActivity = Math.floor(
      (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivity > 2 && !hasActivityToday) {
      return {
        type: 'reminder',
        icon: Heart,
        message: 'Welcome back! Ready to continue your journey?',
        actionText: 'Start reading',
        actionPath: '/bible',
      };
    }
  }

  // Priority 3: No activity today (gentle reminder)
  if (!hasActivityToday && streak > 0) {
    return {
      type: 'reminder',
      icon: Flame,
      message: `Keep your ${streak}-day streak alive today.`,
      actionText: 'Continue',
      actionPath: '/bible',
    };
  }

  // Priority 4: Reading milestones
  if (versesRead === 25) {
    return {
      type: 'milestone',
      icon: Sparkles,
      message: 'You've read 25 verses! Keep exploring.',
    };
  }
  if (versesRead === 50) {
    return {
      type: 'milestone',
      icon: Sparkles,
      message: '50 verses read! You're making great progress.',
    };
  }
  if (versesRead === 100) {
    return {
      type: 'milestone',
      icon: Trophy,
      message: '100 verses! Your dedication is inspiring.',
    };
  }

  // Priority 5: Highlights milestone
  if (highlightsCount === 10) {
    return {
      type: 'milestone',
      icon: Sparkles,
      message: '10 verses highlighted! Building your collection.',
    };
  }

  // Priority 6: Notes milestone
  if (notesCount === 5) {
    return {
      type: 'milestone',
      icon: Sparkles,
      message: '5 notes written! Keep capturing insights.',
    };
  }

  // Priority 7: Purpose-based encouragement
  const purposeMessages: Record<string, MotivationalMessage> = {
    "I'm exploring who Jesus is": {
      type: 'encouragement',
      icon: BookOpen,
      message: 'Discover more about Jesus in today's reading.',
      actionText: 'Explore',
      actionPath: '/bible',
    },
    "I want to build a daily reading habit": {
      type: 'encouragement',
      icon: Target,
      message: 'Every day counts toward building your habit.',
      actionText: 'Read now',
      actionPath: '/bible',
    },
    "I'm going through something difficult": {
      type: 'encouragement',
      icon: Heart,
      message: 'Find comfort and strength in today's verses.',
      actionText: 'Find peace',
      actionPath: '/bible',
    },
    "I want to go deeper in my faith": {
      type: 'encouragement',
      icon: Sparkles,
      message: 'Dig deeper into Scripture today.',
      actionText: 'Study now',
      actionPath: '/bible',
    },
    "I'm studying the Bible seriously": {
      type: 'encouragement',
      icon: BookOpen,
      message: 'Continue your serious study of God's word.',
      actionText: 'Study',
      actionPath: '/bible',
    },
  };

  const purposeMessage = purposeMessages[purpose];
  if (purposeMessage) {
    return purposeMessage;
  }

  // Default: No special message (will not render banner)
  return null;
}

/**
 * Get a dynamic subtitle message based on activity and purpose
 */
export function getDynamicSubtitle(context: {
  purpose: string;
  streak: number;
  hasActivityToday: boolean;
}): string {
  const { purpose, streak, hasActivityToday } = context;

  // If they have a streak and haven't completed today
  if (streak > 0 && !hasActivityToday) {
    return `Keep your ${streak}-day streak going today.`;
  }

  // If they completed today with a streak
  if (hasActivityToday && streak > 0) {
    return `${streak}-day streak! Keep up the great work.`;
  }

  // Purpose-based messages
  const purposeSubtitles: Record<string, string> = {
    "I'm exploring who Jesus is": "Continue discovering who Jesus is.",
    "I want to build a daily reading habit": "Ready to continue your habit?",
    "I'm going through something difficult": "Find strength in today's reading.",
    "I want to go deeper in my faith": "Deepen your understanding today.",
    "I'm studying the Bible seriously": "Continue your study journey.",
  };

  return purposeSubtitles[purpose] || "Ready to continue your journey?";
}
