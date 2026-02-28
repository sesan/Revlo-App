import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

const STEPS = [
  {
    question: "What brings you here today?",
    options: [
      "I'm exploring who Jesus is",
      "I want to build a daily reading habit",
      "I'm going through something difficult",
      "I want to go deeper in my faith",
      "I'm studying the Bible seriously"
    ]
  },
  {
    question: "How familiar are you with the Bible?",
    options: [
      "Complete beginner — I've never really read it",
      "I've read some — mostly familiar stories",
      "I read regularly but want to go deeper",
      "I study it seriously"
    ]
  },
  {
    question: "What topic matters most to you right now?",
    options: [
      "Who is Jesus?",
      "How do I pray?",
      "Finding peace and comfort",
      "Understanding God's purpose for my life",
      "Love, relationships, and family",
      "Overcoming fear and anxiety"
    ]
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const handleSelect = async (option: string) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = option;
    setAnswers(newAnswers);

    if (currentStep < STEPS.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      // Final step, save to Supabase
      if (user) {
        try {
          // Hardcoded mapping logic
          const topic = newAnswers[2];
          let planName = "The Story of Jesus";
          if (topic === "How do I pray?") planName = "Learning to Talk to God";
          else if (topic === "Finding peace and comfort") planName = "Held by Peace";
          else if (topic === "Understanding God's purpose for my life") planName = "Made with Purpose";
          else if (topic === "Love, relationships, and family") planName = "Love as Scripture Defines It";
          else if (topic === "Overcoming fear and anxiety") planName = "Fear Not";

          await supabase
            .from('profiles')
            .update({
              onboarding_answers: newAnswers,
              onboarding_complete: true,
              current_plan: planName,
              current_day: 1
            })
            .eq('id', user.id);
          
          await refreshProfile();
          navigate('/onboarding/result', { state: { topic } });
        } catch (error) {
          console.error("Error saving onboarding data", error);
        }
      }
    }
  };

  const handleSkip = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSelect(STEPS[2].options[0]); // Default if skipped
    }
  };

  const stepData = STEPS[currentStep];

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-md mx-auto w-full">
      <div className="flex gap-2 mb-6">
        {[0, 1, 2].map((step) => (
          <div
            key={step}
            className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
              step <= currentStep ? 'bg-gold' : 'bg-border'
            }`}
          />
        ))}
      </div>

      <p className="text-center text-[12px] text-text-muted mb-8">
        Step {currentStep + 1} of 3
      </p>

      <h1 className="text-[28px] font-bold tracking-tighter text-text-primary text-center max-w-[340px] mx-auto mb-10">
        {stepData.question}
      </h1>

      <div className="flex-1 space-y-3">
        {stepData.options.map((option) => {
          const isSelected = answers[currentStep] === option;
          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`w-full text-left p-4 rounded-[14px] border min-h-[56px] transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-gold-subtle border-gold'
                  : 'bg-bg-surface border-border hover:bg-bg-hover'
              }`}
            >
              <span className="text-[15px] text-text-primary">{option}</span>
              {isSelected && <Check className="text-gold" size={20} />}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center mt-8 pb-4">
        {currentStep > 0 ? (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="text-[15px] text-text-muted hover:text-text-primary px-4 py-2"
          >
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={handleSkip}
          className="text-[15px] text-text-muted hover:text-text-primary px-4 py-2"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
