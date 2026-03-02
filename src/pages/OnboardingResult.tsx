import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import type { PersonalizedPlan } from '../lib/gemini';

const stagger = (i: number) => ({ delay: 0.1 + i * 0.12 });

function parsePassageRoute(passage: string): string {
  // Handle multi-word books like "1 Corinthians 13" or "Song of Solomon 1:1-5"
  // Strategy: last token is "chapter" or "chapter:verses", everything before is the book
  const parts = passage.trim().split(' ');
  if (parts.length < 2) return '/bible/John/1';

  const last = parts[parts.length - 1];
  const book = parts.slice(0, -1).join(' ');
  const chapter = last.split(':')[0];

  return `/bible/${encodeURIComponent(book)}/${chapter}`;
}

export default function OnboardingResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [plan, setPlan] = useState({ name: '', description: '', day1: '', welcomeMessage: '' });

  useEffect(() => {
    // Check for AI-generated plan first
    const aiPlan = location.state?.plan as PersonalizedPlan | undefined;

    if (aiPlan?.planName) {
      setPlan({
        name: aiPlan.planName,
        description: aiPlan.planDescription,
        day1: aiPlan.day1Passage,
        welcomeMessage: aiPlan.welcomeMessage,
      });
      return;
    }

    // Fallback: existing topic-based hardcoded logic
    const topic = location.state?.topic || "Who is Jesus?";

    if (topic === "How do I pray?") {
      setPlan({
        name: "Learning to Talk to God",
        description: "7 days of scripture and reflection to build a real prayer life.",
        day1: "Matthew 6:5-15",
        welcomeMessage: '',
      });
    } else if (topic === "Finding peace and comfort") {
      setPlan({
        name: "Held by Peace",
        description: "7 passages for when life feels overwhelming. You are not alone.",
        day1: "Psalm 23",
        welcomeMessage: '',
      });
    } else if (topic === "Understanding God's purpose for my life") {
      setPlan({
        name: "Made with Purpose",
        description: "Explore who God says you are and why you are here.",
        day1: "Jeremiah 29:11-14",
        welcomeMessage: '',
      });
    } else if (topic === "Love, relationships, and family") {
      setPlan({
        name: "Love as Scripture Defines It",
        description: "7 days exploring what the Bible says about love, commitment, and family.",
        day1: "1 Corinthians 13",
        welcomeMessage: '',
      });
    } else if (topic === "Overcoming fear and anxiety") {
      setPlan({
        name: "Fear Not",
        description: "7 powerful scriptures for anxiety, fear, and uncertainty.",
        day1: "Isaiah 41:10",
        welcomeMessage: '',
      });
    } else {
      setPlan({
        name: "The Story of Jesus",
        description: "A 7-day journey through the life, words, and resurrection of Jesus Christ.",
        day1: "John 1:1-18",
        welcomeMessage: '',
      });
    }
  }, [location.state]);

  const handleStartReading = () => {
    navigate(parsePassageRoute(plan.day1));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', ...stagger(0) }}
        className="mb-8"
      >
        <CheckCircle2 size={48} className="text-gold mx-auto" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', ...stagger(1) }}
        className="text-[32px] font-bold tracking-tighter text-text-primary mb-2"
      >
        {plan.welcomeMessage || 'Your plan is ready.'}
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', ...stagger(2) }}
        className="text-[22px] font-bold tracking-tighter text-gold mb-4"
      >
        {plan.name}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', ...stagger(3) }}
        className="text-[15px] text-text-secondary mb-10 max-w-[300px]"
      >
        {plan.description}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', ...stagger(4) }}
        className="w-full bg-bg-surface border border-border rounded-xl p-5 mb-10 text-left border-l-[3px] border-l-gold relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-gold"></div>
        <p className="text-[13px] text-text-muted uppercase tracking-wider mb-1">
          Day 1 · Start here
        </p>
        <p className="text-[16px] text-text-primary font-medium">
          {plan.day1}
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', ...stagger(5) }}
        onClick={handleStartReading}
        className="btn-primary w-full mb-4"
      >
        Start Reading Day 1 →
      </motion.button>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ...stagger(6) }}
        onClick={() => navigate('/home')}
        className="text-[15px] text-gold hover:underline"
      >
        Go to my dashboard
      </motion.button>
    </div>
  );
}
