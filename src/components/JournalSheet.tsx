import React, { useState } from 'react';
import { Mic, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import BottomSheet from './BottomSheet';

type Framework = 'HEAR' | 'SOAP' | 'Free Write';

interface JournalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentPassage: {
    id: string;
    book: string;
    chapter: string;
    verses: { verse: number; text: string }[];
  };
  selectedVerses?: { verse: number; text: string }[];
  translation?: string;
}

export default function JournalSheet({ isOpen, onClose, currentPassage, selectedVerses, translation = 'web' }: JournalSheetProps) {
  const { user } = useAuth();
  const [framework, setFramework] = useState<Framework>('HEAR');
  const [fields, setFields] = useState({ f1: '', f2: '', f3: '', f4: '' });
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const contextVerses = selectedVerses && selectedVerses.length > 0
    ? selectedVerses
    : [currentPassage.verses[0]];

  const verseReference = contextVerses.length > 1
    ? `${currentPassage.book} ${currentPassage.chapter}:${contextVerses[0].verse}-${contextVerses[contextVerses.length - 1].verse}`
    : `${currentPassage.book} ${currentPassage.chapter}:${contextVerses[0].verse}`;

  const verseText = contextVerses.map(v => v.text).join(' ');

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);

    try {
      const journalContent = `
${framework === 'HEAR' ? 'Highlight' : framework === 'SOAP' ? 'Scripture' : 'Reflection'}: ${fields.f1}

${framework === 'HEAR' ? 'Explain' : framework === 'SOAP' ? 'Observation' : 'Thoughts'}: ${fields.f2}

${framework === 'HEAR' ? 'Apply' : framework === 'SOAP' ? 'Application' : 'Action'}: ${fields.f3}

${framework === 'HEAR' ? 'Respond' : framework === 'SOAP' ? 'Prayer' : 'Prayer'}: ${fields.f4}
      `.trim();

      const { error: noteError } = await supabase
        .from('notes')
        .insert([{
          user_id: user.id,
          passage_id: currentPassage.id,
          content: journalContent,
          type: 'journal',
          framework: framework === 'Free Write' ? 'free' : framework,
          verse: contextVerses[0].verse.toString()
        }]);

      if (noteError) throw noteError;

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onClose();
        setFields({ f1: '', f2: '', f3: '', f4: '' });
      }, 2000);

    } catch (err) {
      console.error('Error saving journal:', err);
      alert('Failed to save journal entry.');
    } finally {
      setSaving(false);
    }
  };

  const toggleRecording = (field: string) => {
    if (isRecording === field) {
      setIsRecording(null);
      setFields(prev => ({
        ...prev,
        [field]: prev[field as keyof typeof prev] + " [Transcribed text from voice]"
      }));
    } else {
      setIsRecording(field);
    }
  };

  const renderSections = () => {
    if (framework === 'Free Write') {
      return (
        <div className="mt-6">
          <textarea
            value={fields.f1}
            onChange={(e) => setFields({ ...fields, f1: e.target.value })}
            placeholder="Write freely..."
            className="w-full bg-bg-input border border-border rounded-xl p-4 text-[15px] text-text-primary min-h-[300px] focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold resize-none"
          />
        </div>
      );
    }

    const labels = framework === 'HEAR' ? [
      { id: 'f1', letter: 'H', prompt: 'What word or phrase stands out to you?' },
      { id: 'f2', letter: 'E', prompt: 'What does this passage mean in context?' },
      { id: 'f3', letter: 'A', prompt: 'How does this apply to your life right now?' },
      { id: 'f4', letter: 'R', prompt: 'Write a short prayer or personal response.' }
    ] : [
      { id: 'f1', letter: 'S', prompt: 'What does this Scripture say?' },
      { id: 'f2', letter: 'O', prompt: 'What do I observe about this passage?' },
      { id: 'f3', letter: 'A', prompt: 'How can I apply this to my life?' },
      { id: 'f4', letter: 'P', prompt: 'Turn this into a personal prayer.' }
    ];

    return (
      <div className="space-y-6 mt-6">
        {labels.map((section) => (
          <div key={section.id} className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-text-inverse font-bold tracking-tighter text-[18px]">
                  {section.letter}
                </div>
                <p className="text-[13px] text-text-secondary">{section.prompt}</p>
              </div>
              <button
                onClick={() => toggleRecording(section.id)}
                className={`p-2 rounded-full transition-colors ${
                  isRecording === section.id
                    ? 'text-error bg-error/10 animate-pulse'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                }`}
                aria-label={`Record voice for ${section.letter}`}
              >
                <Mic size={20} />
              </button>
            </div>
            <textarea
              value={fields[section.id as keyof typeof fields]}
              onChange={(e) => setFields({ ...fields, [section.id]: e.target.value })}
              className="w-full bg-bg-input border border-border rounded-xl p-3.5 text-[15px] text-text-primary min-h-[100px] focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold resize-none"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight={92}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-text-muted hover:text-text-primary rounded-full hover:bg-bg-hover transition-colors">
          <X size={24} />
        </button>
        <h2 className="text-[16px] font-bold tracking-tight text-text-primary">Journal Entry</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-[14px] font-medium text-gold hover:text-gold-hover px-2 -mr-2 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(env(safe-area-inset-bottom)+80px)]">
        {/* Verse Context Card */}
        <div className="bg-bg-surface border border-border rounded-xl p-4 mb-6 border-l-[3px] border-l-gold">
          <p className="text-[10px] uppercase tracking-[0.1em] text-gold mb-1 font-medium">
            REFLECTING ON
          </p>
          <h2 className="text-[14px] font-medium text-text-primary mb-1">
            {verseReference}
          </h2>
          <p className="text-[14px] text-text-secondary italic line-clamp-2">
            "{verseText}"
          </p>
        </div>

        {/* Framework Selector */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
          {(['HEAR', 'SOAP', 'Free Write'] as Framework[]).map((f) => (
            <button
              key={f}
              onClick={() => setFramework(f)}
              className={`px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors border ${
                framework === f
                  ? 'bg-gold text-text-inverse border-gold'
                  : 'bg-transparent text-gold border-gold-border hover:bg-gold/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Dynamic Sections */}
        {renderSections()}
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-bg-elevated border border-gold rounded-full px-4 py-2.5 shadow-lg flex items-center gap-2">
            <CheckCircle2 size={16} className="text-gold" />
            <span className="text-[14px] text-text-primary font-medium">Journal entry saved.</span>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
