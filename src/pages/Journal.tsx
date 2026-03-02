import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mic, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { KJV_PASSAGES } from '../lib/data';
import BottomNav from '../components/BottomNav';
import { useScrollDirection } from '../hooks/useScrollDirection';

type Framework = 'HEAR' | 'SOAP' | 'Free Write';

export default function Journal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const scrollDirection = useScrollDirection();
  const { id } = useParams(); // If editing an existing journal

  const [framework, setFramework] = useState<Framework>('HEAR');
  const [fields, setFields] = useState({ f1: '', f2: '', f3: '', f4: '' });
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [saving, setSaving] = useState(false);

  // Default context for prototype
  const currentPassage = KJV_PASSAGES[0];

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);

    try {
      const entryData = {
        user_id: user.id,
        passage_id: currentPassage.id,
        framework: framework === 'Free Write' ? 'free' : framework,
        field_1: fields.f1,
        field_2: fields.f2,
        field_3: fields.f3,
        field_4: fields.f4,
      };

      // Save journal entry
      const { error: journalError } = await supabase
        .from('journal_entries')
        .insert([entryData]);

      if (journalError) throw journalError;

      // Save summary note
      const summaryContent = framework === 'Free Write' ? fields.f1 : fields.f1;
      const { error: noteError } = await supabase
        .from('notes')
        .insert([{
          user_id: user.id,
          passage_id: currentPassage.id,
          content: summaryContent.substring(0, 100) + (summaryContent.length > 100 ? '...' : ''),
          type: 'journal',
          framework: framework === 'Free Write' ? 'free' : framework
        }]);

      if (noteError) throw noteError;

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate('/notes');
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
      // Mock transcription
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
    <div className="min-h-screen bg-bg-base flex flex-col pb-[80px]">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-bg-base/90 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold tracking-tighter text-[20px] text-text-primary">Journal Entry</h1>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="text-[14px] font-medium text-gold hover:text-gold-hover px-2 -mr-2 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {/* Verse Context Card */}
        <div className="bg-bg-surface border border-border rounded-xl p-4 mb-6 border-l-[3px] border-l-gold">
          <p className="text-[10px] uppercase tracking-[0.1em] text-gold mb-1 font-medium">
            REFLECTING ON
          </p>
          <h2 className="text-[14px] font-medium text-text-primary mb-1">
            {currentPassage.book} {currentPassage.chapter}:{currentPassage.verses[0].verse}
          </h2>
          <p className="text-[14px] text-text-secondary italic line-clamp-2">
            "{currentPassage.verses[0].text}"
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
        <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-bg-elevated border border-gold rounded-full px-4 py-2.5 shadow-lg flex items-center gap-2">
            <CheckCircle2 size={16} className="text-gold" />
            <span className="text-[14px] text-text-primary font-medium">Journal entry saved.</span>
          </div>
        </div>
      )}

      <BottomNav hidden={scrollDirection === 'down'} />
    </div>
  );
}
