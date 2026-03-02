import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  Search,
  Heart,
  Compass,
  Users,
  Shield,
  HandHeart,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { generatePersonalizedPlan } from '../lib/gemini';

const PURPOSE_OPTIONS = [
  "I'm exploring who Jesus is",
  "I want to build a daily reading habit",
  "I'm going through something difficult",
  "I want to go deeper in my faith",
  "I'm studying the Bible seriously",
];

const EXPERIENCE_OPTIONS = [
  "Complete beginner",
  "I've read some stories",
  "I read regularly",
  "I study it seriously",
];

interface InterestOption {
  label: string;
  icon: typeof Search;
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

const TOTAL_STEPS = 4;

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [experience, setExperience] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const toggleInterest = (label: string) => {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1: return name.trim().length > 0;
      case 2: return purpose !== '';
      case 3: return experience !== '';
      case 4: return interests.length > 0;
      default: return true;
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

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto w-full">
      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full bg-bg-surface border border-border mb-8 flex items-center justify-center"
            >
              <BookOpen size={32} className="text-text-primary" />
            </motion.div>
            <p className="text-[17px] text-text-secondary font-medium">
              Creating your personalised plan...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header — steps 1+ only */}
      {currentStep > 0 && (
        <div className="px-6 pt-6 pb-2">
          {/* Back button */}
          <button
            onClick={() => setCurrentStep((s) => s - 1)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-hover transition-colors mb-4"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Progress bar */}
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
                  i < currentStep ? 'bg-gold' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col px-6">
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
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-28 h-28 rounded-full bg-bg-surface border border-border mb-10 flex items-center justify-center"
              >
                <BookOpen size={44} className="text-text-primary" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-[44px] font-bold tracking-tighter text-text-primary mb-2"
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

          {/* Step 1 — Name */}
          {currentStep === 1 && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pt-8"
            >
              <h1 className="text-[28px] font-bold tracking-tighter text-text-primary mb-2">
                What should we call you?
              </h1>
              <p className="text-[15px] text-text-secondary mb-8">
                This is how you'll appear in the app.
              </p>

              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) handleContinue(); }}
                className="w-full bg-bg-surface border border-border rounded-2xl px-5 py-4 text-[17px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary transition-colors"
                autoFocus
              />
            </motion.div>
          )}

          {/* Step 2 — Purpose */}
          {currentStep === 2 && (
            <motion.div
              key="purpose"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pt-8"
            >
              <h1 className="text-[28px] font-bold tracking-tighter text-text-primary mb-2">
                What brings you here?
              </h1>
              <p className="text-[15px] text-text-secondary mb-8">
                We'll tailor your experience based on this.
              </p>

              <div className="space-y-3">
                {PURPOSE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setPurpose(option)}
                    className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-[15px] transition-all ${
                      purpose === option
                        ? 'border-text-primary bg-bg-surface font-medium'
                        : 'border-border bg-white hover:border-text-muted'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3 — Experience */}
          {currentStep === 3 && (
            <motion.div
              key="experience"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pt-8"
            >
              <h1 className="text-[28px] font-bold tracking-tighter text-text-primary mb-2">
                How familiar are you with the Bible?
              </h1>
              <p className="text-[15px] text-text-secondary mb-8">
                No wrong answer here — we meet you where you are.
              </p>

              <div className="space-y-3">
                {EXPERIENCE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setExperience(option)}
                    className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-[15px] transition-all ${
                      experience === option
                        ? 'border-text-primary bg-bg-surface font-medium'
                        : 'border-border bg-white hover:border-text-muted'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4 — Interests (multi-select chips) */}
          {currentStep === 4 && (
            <motion.div
              key="interests"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pt-8"
            >
              <h1 className="text-[28px] font-bold tracking-tighter text-text-primary mb-2">
                What topics interest you?
              </h1>
              <p className="text-[15px] text-text-secondary mb-8">
                Pick as many as you like. We'll build your plan around these.
              </p>

              <div className="flex flex-wrap gap-3">
                {INTEREST_OPTIONS.map((option) => {
                  const isSelected = interests.includes(option.label);
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.label}
                      onClick={() => toggleInterest(option.label)}
                      className={`inline-flex items-center gap-2 px-5 py-3 rounded-full border-2 text-[14px] font-medium transition-all ${
                        isSelected
                          ? 'border-text-primary bg-text-primary text-text-inverse'
                          : 'border-border bg-white text-text-primary hover:border-text-muted'
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
      </div>

      {/* Bottom — Continue button for steps 1-4 */}
      {currentStep > 0 && (
        <div className="px-6 pb-8 pt-4 space-y-3">
          <button
            onClick={handleContinue}
            disabled={!canContinue() || submitting}
            className="btn-primary w-full disabled:opacity-30 disabled:pointer-events-none"
          >
            {submitting ? 'Setting up...' : 'Continue'}
          </button>
          {currentStep < TOTAL_STEPS && (
            <button
              onClick={() => setCurrentStep((s) => s + 1)}
              className="w-full text-center text-[14px] text-text-muted hover:text-text-primary py-2 transition-colors"
            >
              Skip
            </button>
          )}
        </div>
      )}
    </div>
  );
}
