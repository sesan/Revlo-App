import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserCircle,
  BookOpen,
  Highlighter,
  PenTool,
  BookHeart,
  Check,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChecklistItem {
  label: string;
  icon: LucideIcon;
  completed: boolean;
  action: () => void;
}

interface SetupChecklistProps {
  profile: any;
  user: { id: string } | null;
  onNavigate: (path: string) => void;
  onNamePrompt: () => void;
}

export default function SetupChecklist({ profile, user, onNavigate, onNamePrompt }: SetupChecklistProps) {
  const [highlightCount, setHighlightCount] = useState<number | null>(null);
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [journalCount, setJournalCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      const [highlights, notes, journals] = await Promise.all([
        supabase
          .from('highlights')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('type', 'note'),
        supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('type', 'journal'),
      ]);

      setHighlightCount(highlights.count ?? 0);
      setNoteCount(notes.count ?? 0);
      setJournalCount(journals.count ?? 0);
    };

    fetchCounts();
  }, [user]);

  // Wait for counts to load
  if (highlightCount === null || noteCount === null || journalCount === null) return null;

  const hasActivity = (highlightCount > 0) || (noteCount > 0) || (journalCount > 0);

  const items: ChecklistItem[] = [
    {
      label: 'Set up your profile',
      icon: UserCircle,
      completed: !!profile?.full_name,
      action: onNamePrompt,
    },
    {
      label: 'Read your first chapter',
      icon: BookOpen,
      completed: (profile?.current_day > 1) || hasActivity,
      action: () => onNavigate('/bible'),
    },
    {
      label: 'Highlight a verse',
      icon: Highlighter,
      completed: highlightCount > 0,
      action: () => onNavigate('/bible'),
    },
    {
      label: 'Write a note',
      icon: PenTool,
      completed: noteCount > 0,
      action: () => onNavigate('/bible'),
    },
    {
      label: 'Start a journal',
      icon: BookHeart,
      completed: journalCount > 0,
      action: () => onNavigate('/journal'),
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;

  // Auto-hide when all done
  if (completedCount === 5) return null;

  const progressPercent = (completedCount / 5) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        className="bg-bg-surface border border-border rounded-2xl p-5 mb-4"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[16px] font-bold text-text-primary">Get Started</h3>
          <span className="text-[13px] text-text-secondary">{completedCount} of 5 complete</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden mb-5">
          <motion.div
            className="h-full bg-gold rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Checklist items */}
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.completed ? undefined : item.action}
                disabled={item.completed}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  item.completed
                    ? 'opacity-60 cursor-default'
                    : 'hover:bg-bg-hover cursor-pointer'
                }`}
              >
                {/* Checkbox circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors ${
                    item.completed
                      ? 'bg-text-primary border-text-primary'
                      : 'border-border bg-bg-surface'
                  }`}
                >
                  {item.completed && <Check size={14} className="text-text-inverse" />}
                </div>

                {/* Icon */}
                <Icon size={18} className="text-text-secondary flex-shrink-0" />

                {/* Label */}
                <span
                  className={`text-[14px] text-text-primary flex-1 text-left ${
                    item.completed ? 'line-through' : ''
                  }`}
                >
                  {item.label}
                </span>

                {/* Chevron for incomplete items */}
                {!item.completed && (
                  <ChevronRight size={16} className="text-text-muted flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
