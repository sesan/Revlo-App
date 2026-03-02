import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  Highlighter,
  PenTool,
  BookHeart,
  Calendar,
  Flame,
  Trophy,
} from 'lucide-react';
import { getUserStatistics, UserStatistics } from '../lib/statistics';
import WeeklyActivityChart from './WeeklyActivityChart';
import { SkeletonCard } from './Skeleton';

interface StatisticsDashboardProps {
  userId: string;
  currentDay: number;
}

export default function StatisticsDashboard({ userId, currentDay }: StatisticsDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load expanded state from localStorage
    const savedState = localStorage.getItem('statisticsDashboardExpanded');
    if (savedState === 'true') {
      setIsExpanded(true);
    }
  }, []);

  useEffect(() => {
    // Fetch statistics only when expanded
    if (isExpanded && !statistics && !loading) {
      fetchStatistics();
    }
  }, [isExpanded]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const stats = await getUserStatistics(userId, currentDay);
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('statisticsDashboardExpanded', String(newState));
  };

  const statCards = [
    { icon: BookOpen, label: 'Verses Read', value: statistics?.versesRead || 0, color: 'text-gold' },
    { icon: Highlighter, label: 'Highlights', value: statistics?.highlightsCount || 0, color: 'text-gold' },
    { icon: PenTool, label: 'Notes', value: statistics?.notesCount || 0, color: 'text-gold' },
    { icon: BookHeart, label: 'Journals', value: statistics?.journalsCount || 0, color: 'text-gold' },
    { icon: Calendar, label: 'Days Active', value: statistics?.daysActive || 0, color: 'text-gold' },
    { icon: Flame, label: 'Current Streak', value: statistics?.currentStreak || 0, color: 'text-orange-500' },
  ];

  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-5 mb-4">
      {/* Header - Always visible */}
      <button
        onClick={handleToggle}
        className="w-full flex justify-between items-center hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-gold" />
          <h3 className="text-[16px] font-bold text-text-primary">Your Reading Journey</h3>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-text-secondary" />
        ) : (
          <ChevronDown size={20} className="text-text-secondary" />
        )}
      </button>

      {/* Quick stats row - Always visible */}
      {!isExpanded && (
        <div className="flex gap-4 mt-4 text-center">
          <div className="flex-1">
            <p className="text-[20px] font-bold text-text-primary">{statistics?.versesRead || 0}</p>
            <p className="text-[11px] text-text-muted">Verses</p>
          </div>
          <div className="flex-1">
            <p className="text-[20px] font-bold text-text-primary">{statistics?.currentStreak || 0}</p>
            <p className="text-[11px] text-text-muted">Day Streak</p>
          </div>
          <div className="flex-1">
            <p className="text-[20px] font-bold text-text-primary">{statistics?.daysActive || 0}</p>
            <p className="text-[11px] text-text-muted">Days Active</p>
          </div>
        </div>
      )}

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {loading && !statistics ? (
              <div className="mt-4">
                <SkeletonCard />
              </div>
            ) : (
              <div className="mt-4 space-y-6">
                {/* Stat cards grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="bg-bg-hover rounded-xl p-4 text-center"
                      >
                        <Icon size={20} className={`${stat.color} mx-auto mb-2`} />
                        <p className="text-[24px] font-bold text-text-primary mb-1">{stat.value}</p>
                        <p className="text-[12px] text-text-muted">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Weekly activity chart */}
                {statistics?.weeklyActivity && statistics.weeklyActivity.length > 0 && (
                  <div className="bg-bg-hover rounded-xl p-4">
                    <WeeklyActivityChart weeklyActivity={statistics.weeklyActivity} />
                  </div>
                )}

                {/* Additional stats */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-bg-hover rounded-xl p-3">
                    <p className="text-[11px] text-text-muted mb-1">Longest Streak</p>
                    <p className="text-[18px] font-bold text-text-primary">
                      {statistics?.longestStreak || 0} days
                    </p>
                  </div>
                  <div className="bg-bg-hover rounded-xl p-3">
                    <p className="text-[11px] text-text-muted mb-1">Most Highlighted</p>
                    <p className="text-[18px] font-bold text-text-primary truncate">
                      {statistics?.mostHighlightedBook || 'None yet'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
