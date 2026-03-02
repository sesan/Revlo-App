import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Send, BookOpen, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from '../lib/TranslationContext';
import { fetchPassage } from '../lib/bibleApi';
import { SkeletonCard, SkeletonLine } from './Skeleton';
import BottomSheet from './BottomSheet';

interface Reply {
  id: string;
  content: string;
  created_at: string;
}

interface Note {
  id: string;
  content: string;
  type: string;
  framework: string | null;
  tags: string[] | null;
  created_at: string;
  book: string | null;
  chapter: number | null;
  verse: number | null;
}

interface Thought {
  id: string;
  content: string;
  created_at: string;
  isOriginal: boolean;
}

interface NoteThreadSheetProps {
  noteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NoteThreadSheet({ noteId, isOpen, onClose }: NoteThreadSheetProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { translation } = useTranslation();

  const [note, setNote] = useState<Note | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [verseText, setVerseText] = useState('');
  const [newThought, setNewThought] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch data when sheet opens
  useEffect(() => {
    if (isOpen && noteId && user) {
      loadNoteData();
    }
    if (!isOpen) {
      // Reset state when sheet closes
      setNote(null);
      setReplies([]);
      setVerseText('');
      setNewThought('');
      setLoading(true);
      setError(false);
    }
  }, [isOpen, noteId, user]);

  const loadNoteData = async () => {
    try {
      setLoading(true);
      setError(false);

      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .select('id, content, type, framework, tags, created_at, book, chapter, verse')
        .eq('id', noteId)
        .eq('user_id', user!.id)
        .single();

      if (noteError) {
        console.error('Error fetching note:', noteError);
        setError(true);
        return;
      }
      if (!noteData) {
        setError(true);
        return;
      }

      setNote(noteData);

      const { data: replyData } = await supabase
        .from('note_replies')
        .select('id, content, created_at')
        .eq('note_id', noteId)
        .order('created_at', { ascending: true });

      setReplies(replyData || []);

      if (noteData.book && noteData.chapter) {
        try {
          const passage = await fetchPassage(noteData.book, String(noteData.chapter), translation);
          if (noteData.verse) {
            const verse = passage.verses.find((v: any) => v.verse === noteData.verse);
            if (verse) setVerseText(verse.text.trim());
          } else {
            setVerseText(passage.verses[0]?.text.trim() || '');
          }
        } catch {
          // Verse fetch failed — not critical
        }
      }
    } catch (err) {
      console.error('Error loading note:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddThought = async () => {
    if (!newThought.trim() || !user || !noteId || submitting) return;

    try {
      setSubmitting(true);

      const { data, error } = await supabase
        .from('note_replies')
        .insert({
          note_id: noteId,
          user_id: user.id,
          content: newThought.trim(),
        })
        .select('id, content, created_at')
        .single();

      if (error) throw error;

      setReplies(prev => [...prev, data]);
      setNewThought('');

      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    } catch (err) {
      console.error('Error adding thought:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!window.confirm('Delete this thought?')) return;

    try {
      const { error } = await supabase
        .from('note_replies')
        .delete()
        .eq('id', replyId);

      if (error) throw error;

      setReplies(prev => prev.filter(r => r.id !== replyId));
    } catch (err) {
      console.error('Error deleting reply:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddThought();
    }
  };

  const handleOpenInBible = () => {
    if (!note?.book || !note?.chapter) return;
    onClose();
    navigate(`/bible/${note.book}/${note.chapter}${note.verse ? `?verse=${note.verse}` : ''}`);
  };

  const allThoughts: Thought[] = note
    ? [
        { id: note.id, content: note.content, created_at: note.created_at, isOriginal: true },
        ...replies.map(r => ({ ...r, isOriginal: false })),
      ]
    : [];

  const totalCount = allThoughts.length;
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const verseReference = note?.book
    ? `${note.book} ${note.chapter}${note.verse ? `:${note.verse}` : ''}`
    : '';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight={95} ariaLabel="Note thread">
      <div className="flex flex-col min-h-[85vh]">
      {loading ? (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          <SkeletonCard />
          <SkeletonLine width="120px" height="16px" />
          <div className="grid grid-cols-[24px_1fr] gap-x-3 relative">
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-bg-hover animate-pulse" />
              <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-bg-hover" />
            </div>
            <div className="space-y-2 pb-5 min-w-0">
              <SkeletonLine width="90%" />
              <SkeletonLine width="60%" />
              <SkeletonLine width="80px" height="12px" />
            </div>
          </div>
          {[1, 2].map(i => (
            <div key={i} className="grid grid-cols-[24px_20px_1fr] gap-x-2 relative">
              <div className="absolute left-[11px] top-0 w-[21px] h-[18px] border-l-2 border-b-2 border-bg-hover rounded-bl-[12px]" />
              <div />
              <div className="pt-[8px]">
                <div className="w-5 h-5 rounded-full bg-bg-hover animate-pulse" />
              </div>
              <div className="pt-[8px] space-y-2 pb-4 min-w-0">
                <SkeletonLine width="85%" />
                <SkeletonLine width="50%" />
                <SkeletonLine width="80px" height="12px" />
              </div>
            </div>
          ))}
        </div>
      ) : note ? (
        <>
          {/* Scrollable Content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="px-4 py-6 pb-4">
              {/* Verse Card */}
              {verseReference && (
                <div className="bg-bg-surface border border-border rounded-xl p-4 mb-5 border-l-[3px] border-l-gold">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-gold mb-1 font-medium">
                    {note.type === 'journal' ? 'REFLECTING ON' : 'VERSE'}
                  </p>
                  <h2 className="text-[14px] font-medium text-text-primary mb-1">
                    {verseReference}
                  </h2>
                  {verseText && (
                    <p className="text-[14px] text-text-secondary italic line-clamp-3">
                      "{verseText}"
                    </p>
                  )}
                  <button
                    onClick={handleOpenInBible}
                    className="text-[12px] text-gold font-medium mt-2 hover:underline"
                  >
                    Open in Bible →
                  </button>
                </div>
              )}

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-4">
                  {note.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="bg-bg-elevated border border-border text-[11px] text-text-muted px-2 py-0.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Thought Count */}
              <p className="text-[13px] text-text-muted mb-4">
                💬 {totalCount} {totalCount === 1 ? 'thought' : 'thoughts'}
              </p>

              {/* Thread Timeline */}
              <div>
                <AnimatePresence initial={false}>
                  {allThoughts.map((thought, i) => {
                    const isRoot = i === 0;
                    const isLast = i === allThoughts.length - 1;
                    const hasReplies = replies.length > 0;

                    if (isRoot) {
                      return (
                        <motion.div
                          key={thought.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className="grid grid-cols-[24px_1fr] gap-x-3 relative"
                        >
                          <div className="relative">
                            <div className="w-6 h-6 rounded-full bg-gold shrink-0 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white leading-none">{initials}</span>
                            </div>
                            {hasReplies && (
                              <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-border" />
                            )}
                          </div>
                          <div className="pb-5 min-w-0">
                            <p className="text-[14px] text-text-primary whitespace-pre-wrap break-words">
                              {thought.content}
                            </p>
                            <span className="text-[11px] text-text-muted mt-1.5 block">
                              {format(new Date(thought.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div
                        key={thought.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-[24px_20px_1fr] gap-x-2 relative"
                      >
                        {!isLast && (
                          <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-border" />
                        )}
                        <div className="absolute left-[11px] top-0 w-[21px] h-[18px] border-l-2 border-b-2 border-border rounded-bl-[12px]" />
                        <div />
                        <div className="pt-[8px]">
                          <div className="w-5 h-5 rounded-full bg-gold shrink-0 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-white leading-none">{initials}</span>
                          </div>
                        </div>
                        <div className="pt-[8px] pb-4 min-w-0">
                          <p className="text-[14px] text-text-primary whitespace-pre-wrap break-words">
                            {thought.content}
                          </p>
                          <div className="flex justify-between items-center mt-1.5">
                            <span className="text-[11px] text-text-muted">
                              {format(new Date(thought.created_at), 'MMM d, h:mm a')}
                            </span>
                            <button
                              onClick={() => handleDeleteReply(thought.id)}
                              className="text-text-muted hover:text-error transition-colors p-1"
                              aria-label="Delete thought"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Input */}
          <div className="border-t border-border px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={newThought}
                onChange={(e) => setNewThought(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a thought..."
                rows={1}
                className="flex-1 bg-bg-input border border-border rounded-xl px-4 py-3 text-[14px] text-text-primary resize-none focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-colors max-h-[120px]"
                style={{ minHeight: '44px' }}
              />
              <button
                onClick={handleAddThought}
                disabled={!newThought.trim() || submitting}
                className="bg-gold text-text-inverse rounded-xl p-3 disabled:opacity-40 hover:bg-gold-hover transition-colors shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <AlertCircle size={36} className="text-text-muted mb-3" />
          <p className="text-[15px] font-semibold text-text-primary mb-1">Couldn't load note</p>
          <p className="text-[13px] text-text-secondary mb-4 text-center">Something went wrong. Try again.</p>
          <button
            onClick={loadNoteData}
            className="text-[13px] text-gold font-medium hover:underline"
          >
            Retry
          </button>
        </div>
      )}
      </div>
    </BottomSheet>
  );
}
