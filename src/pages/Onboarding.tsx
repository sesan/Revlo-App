import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Search,
  BookOpen,
  Heart,
  Flame,
  GraduationCap,
  Sparkles,
  BookHeart,
  Compass,
  HandHeart,
  Users,
  Shield,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

interface StepOption {
  label: string;
  icon: LucideIcon;
}

const PURPOSE_OPTIONS: StepOption[] = [
  { label: "I'm exploring who Jesus is", icon: Search },
  { label: "I want to build a daily reading habit", icon: BookOpen },
  { label: "I'm going through something difficult", icon: Heart },
  { label: "I want to go deeper in my faith", icon: Flame },
  { label: "I'm studying the Bible seriously", icon: GraduationCap },
];

const EXPERIENCE_OPTIONS: StepOption[] = [
  { label: "Complete beginner — I've never really read it", icon: Sparkles },
  { label: "I've read some — mostly familiar stories", icon: BookHeart },
  { label: "I read regularly but want to go deeper", icon: Compass },
  { label: "I study it seriously", icon: GraduationCap },
];

interface InterestOption extends StepOption {
  plan: string;
  topic: string;
}

const INTEREST_OPTIONS: InterestOption[] = [
  { label: "Who is Jesus?", icon: Search, plan: "The Story of Jesus", topic: "Who is Jesus?" },
  { label: "Prayer", icon: HandHeart, plan: "Learning to Talk to God", topic: "How do I pray?" },
  { label: "Peace & Comfort", icon: Heart, plan: "Held by Peace", topic: "Finding peace and comfort" },
  { label: "God's Purpose", icon: Compass, plan: "Made with Purpose", topic: "Understanding God's purpose for my life" },
  { label: "Love & Family", icon: Users, plan: "Love as Scripture Defines It", topic: "Love, relationships, and family" },
  { label: "Overcoming Fear", icon: Shield, plan: "Fear Not", topic: "Overcoming fear and anxiety" },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [purpose, setPurpose] = useState('');
  const [experience, setExperience] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const handleSingleSelect = (value: string, setter: (v: string) => void) => {
    setter(value);
    setTimeout(() => setCurrentStep((s) => s + 1), 350);
  };

  const toggleInterest = (label: string) => {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  const handleSubmit = async () => {
    if (!user || submitting) return;
    setSubmitting(true);

    try {
      const firstInterest = INTEREST_OPTIONS.find((o) => o.label === interests[0]);
      const planName = firstInterest?.plan || "The Story of Jesus";
      const topic = firstInterest?.topic || "Who is Jesus?";

      await supabase
        .from('profiles')
        .update({
          purpose,
          experience,
          interests,
          onboarding_answers: [purpose, experience, interests],
          onboarding_complete: true,
          current_plan: planName,
          current_day: 1,
        })
        .eq('id', user.id);

      await refreshProfile();
      navigate('/onboarding/result', { state: { topic } });
    } catch (error) {
      console.error('Error saving onboarding data', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleSkip = () => {
    if (currentStep < 3) setCurrentStep((s) => s + 1);
  };

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-md mx-auto w-full">
      {/* Progress bar — steps 1-3 only */}
      {currentStep > 0 && (
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
                step <= currentStep ? 'bg-gold' : 'bg-border'
              }`}
            />
          ))}
        </div>
      )}

      {/* Step counter — steps 1-3 only */}
      {currentStep > 0 && (
        <>
          <p className="text-center text-[12px] text-text-muted mb-1">
            Step {currentStep} of 3
          </p>
          <p className="text-center text-[13px] text-text-secondary mb-8">
            Let's personalize your experience
          </p>
        </>
      )}

      <AnimatePresence mode="wait">
        {/* Step 0 — Welcome */}
        {currentStep === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            {/* Decorative gradient element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-bg-hover to-border mb-10 flex items-center justify-center"
            >
              <BookOpen size={48} className="text-text-primary" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-[48px] font-bold tracking-tighter text-text-primary mb-3"
            >
              Verse
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="text-[16px] text-text-secondary mb-16"
            >
              Your personal Bible companion
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              onClick={() => setCurrentStep(1)}
              className="btn-primary w-full"
            >
              Get Started
            </motion.button>
          </motion.div>
        )}

        {/* Step 1 — Purpose */}
        {currentStep === 1 && (
          <motion.div
            key="purpose"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <h1 className="text-[28px] font-bold tracking-tighter text-text-primary text-center max-w-[340px] mx-auto mb-10">
              What brings you here today?
            </h1>

            <div className="space-y-3">
              {PURPOSE_OPTIONS.map((option) => {
                const isSelected = purpose === option.label;
                const Icon = option.icon;
                return (
                  <button
                    key={option.label}
                    onClick={() => handleSingleSelect(option.label, setPurpose)}
                    className={`w-full text-left p-4 rounded-[14px] border min-h-[56px] transition-all flex items-center gap-4 ${
                      isSelected
                        ? 'bg-gold-subtle border-gold'
                        : 'bg-bg-surface border-border hover:bg-bg-hover'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-text-primary text-text-inverse'
                          : 'bg-bg-hover text-text-secondary'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="text-[15px] text-text-primary flex-1">{option.label}</span>
                    {isSelected && <Check className="text-gold flex-shrink-0" size={20} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 2 — Experience */}
        {currentStep === 2 && (
          <motion.div
            key="experience"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <h1 className="text-[28px] font-bold tracking-tighter text-text-primary text-center max-w-[340px] mx-auto mb-10">
              How familiar are you with the Bible?
            </h1>

            <div className="space-y-3">
              {EXPERIENCE_OPTIONS.map((option) => {
                const isSelected = experience === option.label;
                const Icon = option.icon;
                return (
                  <button
                    key={option.label}
                    onClick={() => handleSingleSelect(option.label, setExperience)}
                    className={`w-full text-left p-4 rounded-[14px] border min-h-[56px] transition-all flex items-center gap-4 ${
                      isSelected
                        ? 'bg-gold-subtle border-gold'
                        : 'bg-bg-surface border-border hover:bg-bg-hover'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-text-primary text-text-inverse'
                          : 'bg-bg-hover text-text-secondary'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="text-[15px] text-text-primary flex-1">{option.label}</span>
                    {isSelected && <Check className="text-gold flex-shrink-0" size={20} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 3 — Interests (multi-select chips) */}
        {currentStep === 3 && (
          <motion.div
            key="interests"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <h1 className="text-[28px] font-bold tracking-tighter text-text-primary text-center max-w-[340px] mx-auto mb-3">
              What topics interest you?
            </h1>
            <p className="text-center text-[14px] text-text-secondary mb-10">
              {interests.length === 0
                ? 'Select at least one topic'
                : `${interests.length} selected`}
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              {INTEREST_OPTIONS.map((option) => {
                const isSelected = interests.includes(option.label);
                const Icon = option.icon;
                return (
                  <button
                    key={option.label}
                    onClick={() => toggleInterest(option.label)}
                    className={`inline-flex items-center gap-2 px-5 py-3 rounded-full border text-[14px] font-medium transition-all ${
                      isSelected
                        ? 'bg-text-primary text-text-inverse border-text-primary'
                        : 'bg-bg-surface text-text-primary border-border hover:bg-bg-hover'
                    }`}
                  >
                    <Icon size={16} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1" />

      {/* Bottom navigation — steps 1-3 */}
      {currentStep > 0 && (
        <div className="mt-8 pb-4 space-y-4">
          {/* Continue button for step 3 */}
          {currentStep === 3 && (
            <button
              onClick={handleSubmit}
              disabled={interests.length === 0 || submitting}
              className="btn-primary w-full disabled:opacity-40 disabled:pointer-events-none"
            >
              {submitting ? 'Setting up...' : 'Continue'}
            </button>
          )}

          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              className="text-[15px] text-text-muted hover:text-text-primary px-4 py-2 flex items-center gap-1"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            {currentStep < 3 && (
              <button
                onClick={handleSkip}
                className="text-[15px] text-text-muted hover:text-text-primary px-4 py-2"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
