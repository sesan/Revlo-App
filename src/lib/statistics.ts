import { supabase } from './supabase';
import { isSameDay, differenceInDays, subDays } from 'date-fns';

export interface UserStatistics {
  versesRead: number;
  highlightsCount: number;
  notesCount: number;
  journalsCount: number;
  daysActive: number;
  currentStreak: number;
  longestStreak: number;
  weeklyActivity: Array<{ day: string; count: number }>;
  mostHighlightedBook: string;
  planCompletion: number;
}

// Cache statistics with 5-minute TTL
const cache = new Map<string, { data: UserStatistics; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Calculate user's current and longest streak
 */
function calculateStreaks(activityDates: Date[]): { current: number; longest: number } {
  if (activityDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  const sortedDates = activityDates.sort((a, b) => b.getTime() - a.getTime());
  let currentStreak = 0;
  let longestStreak = 0;
  let checkDate = new Date();

  // Check if there's activity today
  const hasActivityToday = sortedDates.some(d => isSameDay(d, checkDate));
  if (hasActivityToday) {
    currentStreak++;
    checkDate = subDays(checkDate, 1);
  } else {
    // If no activity today, check if there was activity yesterday (streak still active)
    const hasActivityYesterday = sortedDates.some(d => isSameDay(d, subDays(checkDate, 1)));
    if (!hasActivityYesterday) {
      // Streak is broken
      currentStreak = 0;
    } else {
      checkDate = subDays(checkDate, 1);
    }
  }

  // Count backwards for current streak
  if (currentStreak > 0 || checkDate.getTime() !== new Date().getTime()) {
    while (true) {
      const hasActivity = sortedDates.some(d => isSameDay(d, checkDate));
      if (hasActivity) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let tempStreak = 1;
  let previousDate = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = sortedDates[i];
    const daysDiff = differenceInDays(previousDate, currentDate);

    if (daysDiff === 1) {
      tempStreak++;
    } else if (daysDiff === 0) {
      // Same day, continue
      continue;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }

    previousDate = currentDate;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: Math.max(longestStreak, currentStreak) };
}

/**
 * Get weekly activity counts for the last 7 days
 */
function getWeeklyActivity(activityDates: Date[]): Array<{ day: string; count: number }> {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const weeklyData: Array<{ day: string; count: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const targetDate = subDays(today, i);
    const dayName = days[targetDate.getDay()];
    const count = activityDates.filter(d => isSameDay(d, targetDate)).length;

    weeklyData.push({ day: dayName, count });
  }

  return weeklyData;
}

/**
 * Get the most highlighted book
 */
function getMostHighlightedBook(bookData: Array<{ book: string }>): string {
  if (bookData.length === 0) return 'None yet';

  const bookCounts: Record<string, number> = {};
  bookData.forEach(item => {
    if (item.book) {
      bookCounts[item.book] = (bookCounts[item.book] || 0) + 1;
    }
  });

  let maxBook = 'None yet';
  let maxCount = 0;
  Object.entries(bookCounts).forEach(([book, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxBook = book;
    }
  });

  return maxBook;
}

/**
 * Fetch and calculate comprehensive user statistics
 */
export async function getUserStatistics(userId: string, currentDay: number = 1): Promise<UserStatistics> {
  // Check cache
  const cached = cache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Batch fetch all data in parallel
    const [
      highlightsResult,
      notesResult,
      journalsResult,
      allNotesResult,
      passagesResult,
      bookDataResult,
    ] = await Promise.all([
      supabase
        .from('highlights')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'note'),
      supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'journal'),
      supabase
        .from('notes')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('notes')
        .select('passage_id')
        .eq('user_id', userId)
        .not('passage_id', 'is', null),
      supabase
        .from('notes')
        .select('book')
        .eq('user_id', userId)
        .not('book', 'is', null),
    ]);

    const highlightsCount = highlightsResult.count ?? 0;
    const notesCount = notesResult.count ?? 0;
    const journalsCount = journalsResult.count ?? 0;

    // Calculate unique verses read
    const uniquePassages = new Set((passagesResult.data || []).map(p => p.passage_id));
    const versesRead = uniquePassages.size;

    // Get activity dates
    const activityDates = (allNotesResult.data || []).map(n => new Date(n.created_at));

    // Calculate unique days active
    const uniqueDays = new Set(activityDates.map(d => d.toDateString()));
    const daysActive = uniqueDays.size;

    // Calculate streaks
    const { current: currentStreak, longest: longestStreak } = calculateStreaks(activityDates);

    // Get weekly activity
    const weeklyActivity = getWeeklyActivity(activityDates);

    // Get most highlighted book
    const mostHighlightedBook = getMostHighlightedBook(bookDataResult.data || []);

    // Calculate plan completion
    const planCompletion = Math.min(Math.round((currentDay / 7) * 100), 100);

    const statistics: UserStatistics = {
      versesRead,
      highlightsCount,
      notesCount,
      journalsCount,
      daysActive,
      currentStreak,
      longestStreak,
      weeklyActivity,
      mostHighlightedBook,
      planCompletion,
    };

    // Cache the result
    cache.set(userId, { data: statistics, timestamp: Date.now() });

    return statistics;
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    // Return default statistics on error
    return {
      versesRead: 0,
      highlightsCount: 0,
      notesCount: 0,
      journalsCount: 0,
      daysActive: 0,
      currentStreak: 0,
      longestStreak: 0,
      weeklyActivity: [],
      mostHighlightedBook: 'None yet',
      planCompletion: 0,
    };
  }
}

/**
 * Clear the statistics cache for a user
 */
export function clearStatisticsCache(userId: string): void {
  cache.delete(userId);
}
