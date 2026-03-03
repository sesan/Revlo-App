import { useState, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mic, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/shared/services/supabase';
import { useAuth } from '@/app/providers/AuthContext';
import { KJV_PASSAGES } from '@/shared/lib/data';
import BottomNav from '@/shared/components/BottomNav';
import { useScrollDirection } from '@/shared/hooks/useScrollDirection';
import { useSpeechToText } from '@/shared/hooks/useSpeechToText';
import { applyTranscriptToJournalFields, appendTranscriptToField } from '@/shared/lib/journalVoice';
import { useAudioRecorder } from '@/shared/hooks/useAudioRecorder';
import { transcribeJournalAudioWithGemini } from '@/shared/services/gemini';

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
  const [isVoiceStarting, setIsVoiceStarting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isVoiceLocked, setIsVoiceLocked] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceProcessError, setVoiceProcessError] = useState<string | null>(null);
  const activeVoiceSessionRef = useRef(0);
  const holdTimerRef = useRef<number | null>(null);
  const holdStartedRef = useRef(false);
  const pendingReleaseProcessRef = useRef(false);
  const suppressNextClickRef = useRef(false);
  const recordingStartRef = useRef<number | null>(null);
  const { isListening, isSupported: isSpeechSupported, error: speechError, clearError: clearSpeechError, startListening, stopListening } = useSpeechToText();
  const { isRecording: isAudioRecording, isSupported: isAudioRecordingSupported, error: audioError, clearError: clearAudioError, startRecording, stopRecording } = useAudioRecorder();
  const hasGeminiApi = Boolean(import.meta.env.VITE_GEMINI_API_KEY);
  const canUseGeminiVoice = hasGeminiApi && isAudioRecordingSupported;
  const isVoiceSupported = canUseGeminiVoice || isSpeechSupported;
  const isVoiceActive = isVoiceStarting || isListening || isAudioRecording || isTranscribing;
  const voiceError = voiceProcessError || audioError || speechError;

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

  const applyGeminiResultForTarget = (
    target: RecordingTarget,
    result: { transcript: string; fields: { f1: string; f2: string; f3: string; f4: string } }
  ) => {
    setFields((prev) => {
      if (target !== 'all') {
        return {
          ...prev,
          [target]: appendTranscriptToField(prev[target], result.transcript)
        };
      }

      return {
        f1: appendTranscriptToField(prev.f1, result.fields.f1),
        f2: appendTranscriptToField(prev.f2, result.fields.f2),
        f3: appendTranscriptToField(prev.f3, result.fields.f3),
        f4: appendTranscriptToField(prev.f4, result.fields.f4)
      };
    });

    setVoiceProcessError(null);
    showVoiceSuccessToast();
  };

  const HOLD_START_DELAY_MS = 220;

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const stopRecordingSession = (process: boolean) => {
    activeVoiceSessionRef.current += 1;
    pendingReleaseProcessRef.current = false;

    if (isListening) {
      stopListening({ process });
    }
    if (isAudioRecording) {
      stopRecording({ process });
    }

    setIsVoiceStarting(false);

    if (!process) {
      setRecordingTarget(null);
      setIsVoiceLocked(false);
      setIsTranscribing(false);
      setVoiceProcessError(null);
    }
  };

  const startRecordingForTarget = async (target: RecordingTarget, lockOnStart: boolean) => {
    if (!isVoiceSupported) {
      alert('Voice transcription is not supported on this browser. Try Chrome or Safari on a newer device.');
      return;
    }

    if (isListening || isAudioRecording) {
      stopRecordingSession(false);
    }

    clearSpeechError();
    clearAudioError();
    setVoiceProcessError(null);
    pendingReleaseProcessRef.current = false;
    setRecordingTarget(target);
    setIsVoiceLocked(lockOnStart);
    setIsVoiceStarting(true);

    if (canUseGeminiVoice) {
      const sessionId = activeVoiceSessionRef.current + 1;
      activeVoiceSessionRef.current = sessionId;

      const started = await startRecording({
        onComplete: async (audioBlob) => {
          if (sessionId !== activeVoiceSessionRef.current) return;

          setIsTranscribing(true);

          try {
            const geminiResult = await transcribeJournalAudioWithGemini(audioBlob, framework);

            if (sessionId !== activeVoiceSessionRef.current) return;
            applyGeminiResultForTarget(target, geminiResult);
          } catch (err) {
            console.error('Voice transcription failed:', err);
            setVoiceProcessError('Could not process this recording. Please try again.');
          } finally {
            if (sessionId === activeVoiceSessionRef.current) {
              setIsTranscribing(false);
            }
          }
        }
      });

      if (!started) {
        if (isSpeechSupported) {
          const speechStarted = startListening({
            onFinalTranscript: (transcript) => {
              applyTranscriptForTarget(target, transcript);
            }
          });
          if (!speechStarted) {
            setRecordingTarget(null);
          }
        } else {
          setRecordingTarget(null);
        }
      }
      setIsVoiceStarting(false);
      if (!lockOnStart && pendingReleaseProcessRef.current) {
        pendingReleaseProcessRef.current = false;
        stopRecordingSession(true);
      }
      return;
    }

    const started = startListening({
      onFinalTranscript: (transcript) => {
        applyTranscriptForTarget(target, transcript);
      }
    });

    if (!started) {
      setRecordingTarget(null);
    }
    setIsVoiceStarting(false);
    if (!lockOnStart && pendingReleaseProcessRef.current) {
      pendingReleaseProcessRef.current = false;
      stopRecordingSession(true);
    }
  };

  const handleMicTap = async (target: RecordingTarget) => {
    if (suppressNextClickRef.current) return;
    pendingReleaseProcessRef.current = false;

    if (recordingTarget === target && (isListening || isAudioRecording)) {
      if (isVoiceLocked) {
        stopRecordingSession(true);
      } else {
        setIsVoiceLocked(true);
      }
      return;
    }

    await startRecordingForTarget(target, true);
  };

  const handleMicPointerDown = (target: RecordingTarget, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!isVoiceSupported || isVoiceActive) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    holdStartedRef.current = false;
    clearHoldTimer();

    holdTimerRef.current = window.setTimeout(() => {
      holdStartedRef.current = true;
      startRecordingForTarget(target, false);
    }, HOLD_START_DELAY_MS);
  };

  const handleMicPointerUp = (target: RecordingTarget) => {
    clearHoldTimer();

    if (!holdStartedRef.current) return;

    holdStartedRef.current = false;
    suppressNextClickRef.current = true;
    window.setTimeout(() => {
      suppressNextClickRef.current = false;
    }, 260);

    if (recordingTarget === target && !isVoiceLocked) {
      if (isListening || isAudioRecording) {
        stopRecordingSession(true);
      } else {
        pendingReleaseProcessRef.current = true;
      }
    }
  };

  useEffect(() => {
    if (!isListening && !isAudioRecording && !isTranscribing && !isVoiceStarting) {
      setRecordingTarget(null);
      setIsVoiceLocked(false);
    }
  }, [isAudioRecording, isListening, isTranscribing, isVoiceStarting]);

  useEffect(() => {
    const isRecordingNow = isListening || isAudioRecording;

    if (!isRecordingNow) {
      recordingStartRef.current = null;
      setRecordingSeconds(0);
      return;
    }

    if (!recordingStartRef.current) {
      recordingStartRef.current = Date.now();
    }

    const tick = () => {
      if (!recordingStartRef.current) return;
      const elapsed = Math.floor((Date.now() - recordingStartRef.current) / 1000);
      setRecordingSeconds(elapsed);
    };

    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [isAudioRecording, isListening]);

  useEffect(() => {
    if (isListening || isAudioRecording) {
      activeVoiceSessionRef.current += 1;
      if (isListening) stopListening({ process: false });
      if (isAudioRecording) stopRecording({ process: false });
      setRecordingTarget(null);
      setIsVoiceStarting(false);
      setIsVoiceLocked(false);
    }
  }, [framework, isAudioRecording, isListening, stopListening, stopRecording]);

  useEffect(() => {
    return () => {
      clearHoldTimer();
    };
  }, []);

  const formattedRecordingTime = `${Math.floor(recordingSeconds / 60)
    .toString()
    .padStart(2, '0')}:${(recordingSeconds % 60).toString().padStart(2, '0')}`;

  const renderSections = () => {
    if (framework === 'Free Write') {
      return (
        <div className="mt-6">
          <div className="flex justify-end mb-3">
            <button
              onClick={() => handleMicTap('all')}
              onPointerDown={(event) => handleMicPointerDown('all', event)}
              onPointerUp={() => handleMicPointerUp('all')}
              onPointerCancel={() => handleMicPointerUp('all')}
              className={`px-3 py-2 rounded-full text-[12px] font-medium border transition-all duration-200 flex items-center gap-2 ${
                recordingTarget === 'all' && isVoiceActive
                  ? 'text-error bg-error/10 border-error shadow-[0_0_0_4px_rgba(198,40,40,0.08)] scale-[1.01]'
                  : 'text-gold border-gold-border hover:bg-gold/10'
              }`}
              aria-label={recordingTarget === 'all' && isVoiceActive ? 'Stop voice recording for reflection' : 'Record voice for reflection'}
              aria-pressed={recordingTarget === 'all' && isVoiceActive}
              disabled={!isVoiceSupported}
            >
              <Mic size={14} />
              {recordingTarget === 'all' && isVoiceStarting
                ? 'Starting...'
                : recordingTarget === 'all' && isTranscribing
                  ? 'Processing...'
                  : recordingTarget === 'all' && (isListening || isAudioRecording)
                    ? 'Stop recording'
                    : 'Record reflection'}
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

    const labels: Array<{ id: 'f1' | 'f2' | 'f3' | 'f4'; letter: string; prompt: string }> = framework === 'HEAR' ? [
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
                onClick={() => handleMicTap(section.id)}
                onPointerDown={(event) => handleMicPointerDown(section.id, event)}
                onPointerUp={() => handleMicPointerUp(section.id)}
                onPointerCancel={() => handleMicPointerUp(section.id)}
                className={`p-2 rounded-full transition-all duration-200 ${
                  recordingTarget === section.id && isVoiceActive
                    ? 'text-error bg-error/10 shadow-[0_0_0_4px_rgba(198,40,40,0.08)] scale-[1.03]' 
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                }`}
                aria-label={recordingTarget === section.id && isVoiceActive ? `Stop recording for ${section.letter}` : `Record voice for ${section.letter}`}
                aria-pressed={recordingTarget === section.id && isVoiceActive}
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
            onClick={() => handleMicTap('all')}
            onPointerDown={(event) => handleMicPointerDown('all', event)}
            onPointerUp={() => handleMicPointerUp('all')}
            onPointerCancel={() => handleMicPointerUp('all')}
            className={`px-3 py-2 rounded-full text-[12px] font-medium border transition-all duration-200 flex items-center gap-2 ${
              recordingTarget === 'all' && isVoiceActive
                ? 'text-error bg-error/10 border-error shadow-[0_0_0_4px_rgba(198,40,40,0.08)] scale-[1.01]'
                : 'text-gold border-gold-border hover:bg-gold/10'
            }`}
            aria-label={recordingTarget === 'all' && isVoiceActive ? 'Stop recording full journal entry' : 'Record full journal entry with voice'}
            aria-pressed={recordingTarget === 'all' && isVoiceActive}
            disabled={!isVoiceSupported}
          >
            <Mic size={14} />
            {recordingTarget === 'all' && isVoiceStarting
              ? 'Starting...'
              : recordingTarget === 'all' && isTranscribing
                ? 'Processing voice...'
                : recordingTarget === 'all' && (isListening || isAudioRecording)
                  ? 'Stop full entry recording'
                  : 'Record full entry'}
          </button>
        </div>

        {!isVoiceActive && (
          <p className="text-[12px] text-text-secondary mb-2">
            Tip: hold to talk and release to process, or tap once to lock and then use Stop or Send.
          </p>
        )}

        {isVoiceStarting && (
          <p role="status" aria-live="polite" className="text-[12px] text-text-secondary mb-2">
            Starting microphone...
          </p>
        )}
        {(isListening || isAudioRecording) && (
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-error/30 bg-error/10 px-3 py-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-error/60 animate-ping"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-error"></span>
            </span>
            <span className="text-[12px] font-medium text-text-primary">
              Recording {formattedRecordingTime}
            </span>
          </div>
        )}
        {(isListening || isAudioRecording) && (
          <p role="status" aria-live="polite" className="text-[12px] text-text-secondary mb-2">
            {isVoiceLocked
              ? 'Recording is locked. Tap Stop to discard or Send to process.'
              : 'Listening... hold to talk and release to process, or tap Lock for hands-free recording.'}
          </p>
        )}
        {(isListening || isAudioRecording) && (
          <div className="mb-2 flex items-center gap-2">
            {!isVoiceLocked && (
              <button
                onClick={() => setIsVoiceLocked(true)}
                className="px-3 py-1.5 text-[12px] rounded-full border border-border text-text-primary bg-bg-elevated hover:bg-bg-hover transition-colors"
              >
                Lock
              </button>
            )}
            {isVoiceLocked && (
              <>
                <button
                  onClick={() => stopRecordingSession(false)}
                  className="px-3 py-1.5 text-[12px] rounded-full border border-border text-text-primary bg-bg-elevated hover:bg-bg-hover transition-colors"
                >
                  Stop
                </button>
                <button
                  onClick={() => stopRecordingSession(true)}
                  className="px-3 py-1.5 text-[12px] rounded-full border border-gold text-text-inverse bg-gold hover:bg-gold-hover transition-colors"
                >
                  Send
                </button>
              </>
            )}
          </div>
        )}
        {isTranscribing && (
          <p role="status" aria-live="polite" className="text-[12px] text-text-secondary mb-2">
            Processing your voice and filling your journal fields...
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
