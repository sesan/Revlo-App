import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  Search,
  Heart,
  Compass,
  Users,
  Shield,
  HandHeart,
  Check,
} from 'lucide-react';
import { supabase } from '@/shared/services/supabase';
import { useAuth } from '@/app/providers/AuthContext';
import { generatePersonalizedPlan } from '@/shared/services/gemini';

const PURPOSE_OPTIONS = [
  "I'm exploring who Jesus is",
  'I want to build a daily reading habit',
  "I'm going through something difficult",
  'I want to go deeper in my faith',
  "I'm studying the Bible seriously",
];

const EXPERIENCE_OPTIONS = [
  'Complete beginner',
  "I've read some stories",
  'I read regularly',
  'I study it seriously',
];

interface InterestOption {
  label: string;
  icon: typeof Search;
  plan: string;
  topic: string;
}

const INTEREST_OPTIONS: InterestOption[] = [
  { label: 'Who is Jesus?', icon: Search, plan: 'The Story of Jesus', topic: 'Who is Jesus?' },
  { label: 'Prayer', icon: HandHeart, plan: 'Learning to Talk to God', topic: 'How do I pray?' },
  { label: 'Peace & Comfort', icon: Heart, plan: 'Held by Peace', topic: 'Finding peace and comfort' },
  { label: "God's Purpose", icon: Compass, plan: 'Made with Purpose', topic: "Understanding God's purpose for my life" },
  { label: 'Love & Family', icon: Users, plan: 'Love as Scripture Defines It', topic: 'Love, relationships, and family' },
  { label: 'Overcoming Fear', icon: Shield, plan: 'Fear Not', topic: 'Overcoming fear and anxiety' },
];

const TOTAL_STEPS = 4;

type OnboardingHeaderProps = {
  currentStep: number;
  onBack: () => void;
  onSkip: () => void;
  canGoBack: boolean;
};

function ProgressSegments({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-[4px] flex-1 rounded-full transition-colors duration-200 ${
            i < currentStep ? 'bg-text-primary' : 'bg-border'
          }`}
        />
      ))}
    </div>
  );
}

function OnboardingHeader({ currentStep, onBack, onSkip, canGoBack }: OnboardingHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-bg-base/95 backdrop-blur-sm px-6 pt-6 pb-3 border-b border-border/70">
      <div className="flex items-center justify-between mb-4 min-h-11">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className="h-11 w-11 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-hover disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        <p className="text-[13px] font-medium text-text-secondary" aria-live="polite">
          Step {currentStep} of {TOTAL_STEPS}
        </p>

        {currentStep < TOTAL_STEPS ? (
          <button
            onClick={onSkip}
            className="h-11 px-3 text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Skip this step"
          >
            Skip
          </button>
        ) : (
          <div className="w-11" aria-hidden="true" />
        )}
      </div>
      <ProgressSegments currentStep={currentStep} totalSteps={TOTAL_STEPS} />
    </header>
  );
}

type SelectableCardProps = {
  label: string;
  selected: boolean;
  onSelect: () => void;
  roleType: 'radio' | 'button';
};

function SelectableCard({ label, selected, onSelect, roleType }: SelectableCardProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98, opacity: 0.95 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onClick={onSelect}
      role={roleType}
      aria-checked={roleType === 'radio' ? selected : undefined}
      aria-pressed={roleType === 'button' ? selected : undefined}
      className={`w-full min-h-12 text-left px-4 py-3.5 rounded-2xl border text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base ${
        selected
          ? 'border-text-primary bg-bg-surface text-text-primary font-medium'
          : 'border-border bg-white text-text-primary hover:border-text-muted'
      }`}
    >
      {label}
    </motion.button>
  );
}

type StickyActionBarProps = {
  onContinue: () => void;
  disabled: boolean;
  isSubmitting: boolean;
};

function StickyActionBar({ onContinue, disabled, isSubmitting }: StickyActionBarProps) {
  return (
    <div className="sticky bottom-0 z-20 bg-bg-base/96 backdrop-blur-sm border-t border-border/70 px-6 pt-4 pb-7">
      <button
        onClick={onContinue}
        disabled={disabled}
        className="btn-primary w-full min-h-12 disabled:opacity-30 disabled:pointer-events-none"
      >
        {isSubmitting ? 'Setting up...' : 'Continue'}
      </button>
    </div>
  );
}

export default function Onboarding() {
  const shouldReduceMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [experience, setExperience] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const purposeGroupId = useId();
  const experienceGroupId = useId();
  const interestsGroupId = useId();

  const toggleInterest = (label: string) => {
    setInterests((prev) => (prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]));
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return name.trim().length > 0;
      case 2:
        return purpose !== '';
      case 3:
        return experience !== '';
      case 4:
        return interests.length > 0;
      default:
        return true;
    }
  };

  const handleContinue = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user || submitting) return;
    setSubmitting(true);
    setLoading(true);

    try {
      const result = await generatePersonalizedPlan({
        name: name.trim(),
        purpose,
        experience,
        interests,
      });

      await supabase
        .from('profiles')
        .update({
          full_name: name.trim(),
          purpose,
          experience,
          interests,
          onboarding_answers: [purpose, experience, interests],
          onboarding_complete: true,
          current_plan: result.planName,
          current_day: 1,
        })
        .eq('id', user.id);

      await refreshProfile();
      navigate('/onboarding/result', { state: { plan: result } });
    } catch (error) {
      console.error('Error saving onboarding data', error);
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: 'easeOut' as const };

  const enterX = shouldReduceMotion ? 0 : 20;
  const exitX = shouldReduceMotion ? 0 : -20;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto w-full bg-bg-base">
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-base"
          >
            <motion.div
              animate={shouldReduceMotion ? undefined : { scale: [1, 1.06, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full bg-bg-surface border border-border mb-6 flex items-center justify-center"
            >
              <BookOpen size={32} className="text-text-primary" />
            </motion.div>
            <p className="text-[17px] text-text-secondary font-medium">Creating your personalised plan...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {currentStep > 0 && (
        <OnboardingHeader
          currentStep={currentStep}
          onBack={() => setCurrentStep((s) => Math.max(1, s - 1))}
          onSkip={() => setCurrentStep((s) => s + 1)}
          canGoBack={currentStep > 1}
        />
      )}

      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          {currentStep === 1 && (
            <motion.section
              key="name"
              initial={{ opacity: 0, x: enterX }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: exitX }}
              transition={transition}
              className="px-6 pt-8 pb-28"
            >
              <h1 className="text-[31px] leading-tight font-bold tracking-tighter text-text-primary mb-2">What should we call you?</h1>
              <p className="text-[15px] text-text-secondary mb-8">This is how you'll appear in the app.</p>

              <div className="bg-bg-surface border border-border rounded-2xl p-4">
                <label htmlFor="onboarding-name" className="text-[13px] font-medium text-text-secondary block mb-2">
                  Your name
                </label>
                <input
                  id="onboarding-name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) handleContinue();
                  }}
                  className="w-full min-h-12 bg-white border border-border rounded-xl px-4 py-3 text-[17px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary"
                  autoFocus
                  aria-describedby="name-help"
                />
                <p id="name-help" className="text-[12px] text-text-muted mt-2">
                  We use this to personalise your reading journey.
                </p>
              </div>
            </motion.section>
          )}

          {currentStep === 2 && (
            <motion.section
              key="purpose"
              initial={{ opacity: 0, x: enterX }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: exitX }}
              transition={transition}
              className="px-6 pt-8 pb-28"
            >
              <h1 className="text-[31px] leading-tight font-bold tracking-tighter text-text-primary mb-2">What brings you here?</h1>
              <p className="text-[15px] text-text-secondary mb-8">We'll tailor your experience based on this.</p>

              <div role="radiogroup" aria-labelledby={purposeGroupId} className="space-y-3">
                <p id={purposeGroupId} className="sr-only">
                  Select one reason you joined
                </p>
                {PURPOSE_OPTIONS.map((option) => (
                  <SelectableCard
                    key={option}
                    label={option}
                    selected={purpose === option}
                    onSelect={() => setPurpose(option)}
                    roleType="radio"
                  />
                ))}
              </div>
            </motion.section>
          )}

          {currentStep === 3 && (
            <motion.section
              key="experience"
              initial={{ opacity: 0, x: enterX }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: exitX }}
              transition={transition}
              className="px-6 pt-8 pb-28"
            >
              <h1 className="text-[31px] leading-tight font-bold tracking-tighter text-text-primary mb-2">
                How familiar are you with the Bible?
              </h1>
              <p className="text-[15px] text-text-secondary mb-8">No wrong answer here — we meet you where you are.</p>

              <div role="radiogroup" aria-labelledby={experienceGroupId} className="space-y-3">
                <p id={experienceGroupId} className="sr-only">
                  Select your Bible familiarity level
                </p>
                {EXPERIENCE_OPTIONS.map((option) => (
                  <SelectableCard
                    key={option}
                    label={option}
                    selected={experience === option}
                    onSelect={() => setExperience(option)}
                    roleType="radio"
                  />
                ))}
              </div>
            </motion.section>
          )}

          {currentStep === 4 && (
            <motion.section
              key="interests"
              initial={{ opacity: 0, x: enterX }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: exitX }}
              transition={transition}
              className="px-6 pt-8 pb-28"
            >
              <h1 className="text-[31px] leading-tight font-bold tracking-tighter text-text-primary mb-2">What topics interest you?</h1>
              <p className="text-[15px] text-text-secondary mb-8">Pick as many as you like. We'll build your plan around these.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-labelledby={interestsGroupId}>
                <p id={interestsGroupId} className="sr-only">
                  Choose one or more interests
                </p>
                {INTEREST_OPTIONS.map((option) => {
                  const isSelected = interests.includes(option.label);
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.label}
                      type="button"
                      whileTap={{ scale: 0.98, opacity: 0.95 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      onClick={() => toggleInterest(option.label)}
                      aria-pressed={isSelected}
                      className={`min-h-14 rounded-2xl border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base ${
                        isSelected
                          ? 'border-text-primary bg-bg-surface text-text-primary'
                          : 'border-border bg-white text-text-primary hover:border-text-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-text-primary bg-text-primary text-text-inverse' : 'border-border text-text-secondary'
                          }`}
                          aria-hidden="true"
                        >
                          {isSelected ? <Check size={16} /> : <Icon size={16} />}
                        </span>
                      </div>
                      <span className="text-[14px] font-medium leading-tight">{option.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {currentStep > 0 && (
        <StickyActionBar onContinue={handleContinue} disabled={!canContinue() || submitting} isSubmitting={submitting} />
      )}
    </div>
  );
}
