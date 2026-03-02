import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mic, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { KJV_PASSAGES } from '../lib/data';
import BottomNav from '../components/BottomNav';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { applyTranscriptToJournalFields, appendTranscriptToField } from '../lib/journalVoice';

type Framework = 'HEAR' | 'SOAP' | 'Free Write';
type RecordingTarget = 'all' | 'f1' | 'f2' | 'f3' | 'f4';

export default function Journal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const scrollDirection = useScrollDirection();
  const { id } = useParams(); // If editing an existing journal

  const [framework, setFramework] = useState<Framework>('HEAR');
  const [fields, setFields] = useState({ f1: '', f2: '', f3: '', f4: '' });
  const [recordingTarget, setRecordingTarget] = useState<RecordingTarget | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showVoiceToast, setShowVoiceToast] = useState(false);
  const [saving, setSaving] = useState(false);
  const { isListening, isSupported: isVoiceSupported, error: voiceError, clearError, startListening, stopListening } = useSpeechToText();

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

  const showVoiceSuccessToast = () => {
    setShowVoiceToast(true);
    setTimeout(() => setShowVoiceToast(false), 1600);
  };

  const applyTranscriptForTarget = (target: RecordingTarget, transcript: string) => {
    setFields((prev) => {
      if (target === 'all') {
        return applyTranscriptToJournalFields(framework, transcript, prev);
      }

      return {
        ...prev,
        [target]: appendTranscriptToField(prev[target], transcript)
      };
    });
    showVoiceSuccessToast();
  };

  const toggleRecording = (target: RecordingTarget) => {
    if (!isVoiceSupported) {
      alert('Voice transcription is not supported on this browser. Try Chrome or Safari on a newer device.');
      return;
    }

    if (isListening && recordingTarget === target) {
      stopListening();
      return;
    }

    clearError();
    setRecordingTarget(target);

    const started = startListening({
      onFinalTranscript: (transcript) => {
        applyTranscriptForTarget(target, transcript);
      }
    });

    if (!started) {
      setRecordingTarget(null);
    }
  };

  useEffect(() => {
    if (!isListening) {
      setRecordingTarget(null);
    }
  }, [isListening]);

  useEffect(() => {
    if (isListening) {
      stopListening();
      setRecordingTarget(null);
    }
  }, [framework, isListening, stopListening]);

  const renderSections = () => {
    if (framework === 'Free Write') {
      return (
        <div className="mt-6">
          <div className="flex justify-end mb-3">
            <button
              onClick={() => toggleRecording('all')}
              className={`px-3 py-2 rounded-full text-[12px] font-medium border transition-colors flex items-center gap-2 ${
                isListening && recordingTarget === 'all'
                  ? 'text-error bg-error/10 border-error'
                  : 'text-gold border-gold-border hover:bg-gold/10'
              }`}
              aria-label={isListening && recordingTarget === 'all' ? 'Stop voice recording for reflection' : 'Record voice for reflection'}
              aria-pressed={isListening && recordingTarget === 'all'}
              disabled={!isVoiceSupported}
            >
              <Mic size={14} />
              {isListening && recordingTarget === 'all' ? 'Stop recording' : 'Record reflection'}
            </button>
          </div>
          <textarea
            value={fields.f1}
            onChange={(e) => setFields({ ...fields, f1: e.target.value })}
            placeholder="Write freely..."
            aria-label="Free write reflection"
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
                  isListening && recordingTarget === section.id
                    ? 'text-error bg-error/10 animate-pulse' 
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                }`}
                aria-label={isListening && recordingTarget === section.id ? `Stop recording for ${section.letter}` : `Record voice for ${section.letter}`}
                aria-pressed={isListening && recordingTarget === section.id}
                disabled={!isVoiceSupported}
              >
                <Mic size={20} />
              </button>
            </div>
            <textarea
              value={fields[section.id as keyof typeof fields]}
              onChange={(e) => setFields({ ...fields, [section.id]: e.target.value })}
              aria-label={section.prompt}
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
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text-primary" aria-label="Go back">
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
              aria-pressed={framework === f}
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

        <div className="mb-2 flex justify-end">
          <button
            onClick={() => toggleRecording('all')}
            className={`px-3 py-2 rounded-full text-[12px] font-medium border transition-colors flex items-center gap-2 ${
              isListening && recordingTarget === 'all'
                ? 'text-error bg-error/10 border-error'
                : 'text-gold border-gold-border hover:bg-gold/10'
            }`}
            aria-label={isListening && recordingTarget === 'all' ? 'Stop recording full journal entry' : 'Record full journal entry with voice'}
            aria-pressed={isListening && recordingTarget === 'all'}
            disabled={!isVoiceSupported}
          >
            <Mic size={14} />
            {isListening && recordingTarget === 'all' ? 'Stop full entry recording' : 'Record full entry'}
          </button>
        </div>

        {isListening && (
          <p role="status" aria-live="polite" className="text-[12px] text-text-secondary mb-2">
            Listening... tap the active microphone button again to finish.
          </p>
        )}
        {voiceError && (
          <p role="alert" className="text-[12px] text-error mb-2">{voiceError}</p>
        )}
        {!isVoiceSupported && (
          <p className="text-[12px] text-text-secondary mb-2">
            Voice transcription is unavailable in this browser.
          </p>
        )}

        {/* Dynamic Sections */}
        {renderSections()}
      </div>

      {/* Success Toast */}
      {showToast && (
        <div role="status" aria-live="polite" className="fixed bottom-[80px] left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-bg-elevated border border-gold rounded-full px-4 py-2.5 shadow-lg flex items-center gap-2">
            <CheckCircle2 size={16} className="text-gold" />
            <span className="text-[14px] text-text-primary font-medium">Journal entry saved.</span>
          </div>
        </div>
      )}

      {showVoiceToast && (
        <div role="status" aria-live="polite" className="fixed bottom-[140px] left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-bg-elevated border border-border rounded-full px-4 py-2.5 shadow-lg">
            <span className="text-[13px] text-text-primary font-medium">Voice transcription added to journal.</span>
          </div>
        </div>
      )}

      <BottomNav hidden={scrollDirection === 'down'} />
    </div>
  );
}
