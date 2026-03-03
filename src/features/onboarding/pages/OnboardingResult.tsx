import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, BookOpen } from 'lucide-react';
import type { PersonalizedPlan } from '@/shared/services/gemini';

function parsePassageRoute(passage: string): string {
  const parts = passage.trim().split(' ');
  if (parts.length < 2) return '/bible/John/1';

  const last = parts[parts.length - 1];
  const book = parts.slice(0, -1).join(' ');
  const chapter = last.split(':')[0];

  return `/bible/${encodeURIComponent(book)}/${chapter}`;
}

export default function OnboardingResult() {
  const shouldReduceMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();
  const [plan, setPlan] = useState({ name: '', description: '', day1: '', welcomeMessage: '' });

  useEffect(() => {
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

    const topic = location.state?.topic || 'Who is Jesus?';

    if (topic === 'How do I pray?') {
      setPlan({
        name: 'Learning to Talk to God',
        description: '7 days of scripture and reflection to build a real prayer life.',
        day1: 'Matthew 6:5-15',
        welcomeMessage: '',
      });
    } else if (topic === 'Finding peace and comfort') {
      setPlan({
        name: 'Held by Peace',
        description: '7 passages for when life feels overwhelming. You are not alone.',
        day1: 'Psalm 23',
        welcomeMessage: '',
      });
    } else if (topic === "Understanding God's purpose for my life") {
      setPlan({
        name: 'Made with Purpose',
        description: 'Explore who God says you are and why you are here.',
        day1: 'Jeremiah 29:11-14',
        welcomeMessage: '',
      });
    } else if (topic === 'Love, relationships, and family') {
      setPlan({
        name: 'Love as Scripture Defines It',
        description: '7 days exploring what the Bible says about love, commitment, and family.',
        day1: '1 Corinthians 13',
        welcomeMessage: '',
      });
    } else if (topic === 'Overcoming fear and anxiety') {
      setPlan({
        name: 'Fear Not',
        description: '7 powerful scriptures for anxiety, fear, and uncertainty.',
        day1: 'Isaiah 41:10',
        welcomeMessage: '',
      });
    } else {
      setPlan({
        name: 'The Story of Jesus',
        description: 'A 7-day journey through the life, words, and resurrection of Jesus Christ.',
        day1: 'John 1:1-18',
        welcomeMessage: '',
      });
    }
  }, [location.state]);

  const handleStartReading = () => {
    navigate(parsePassageRoute(plan.day1));
  };

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: 'easeOut' as const };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-bg-base flex flex-col">
      <main className="flex-1 px-6 pt-10 pb-28">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
          className="bg-bg-surface border border-border rounded-3xl p-6 mb-7"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full border border-border bg-white flex items-center justify-center">
              <CheckCircle2 size={22} className="text-text-primary" />
            </div>
            <p className="text-[13px] uppercase tracking-wider text-text-muted">Ready to begin</p>
          </div>

          <h1 className="text-[30px] leading-tight font-bold tracking-tighter text-text-primary mb-2">
            {plan.welcomeMessage || 'Your plan is ready.'}
          </h1>
          <p className="text-[15px] text-text-secondary">We crafted this around your goals and current season.</p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: shouldReduceMotion ? 0 : 0.04 }}
          className="mb-6"
        >
          <p className="text-[13px] font-medium text-text-muted mb-2">Your plan</p>
          <h2 className="text-[25px] leading-tight font-bold tracking-tighter text-text-primary mb-3">{plan.name}</h2>
          <p className="text-[15px] text-text-secondary">{plan.description}</p>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: shouldReduceMotion ? 0 : 0.08 }}
          className="bg-white border border-border rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] uppercase tracking-wider text-text-muted">Day 1</p>
            <BookOpen size={16} className="text-text-secondary" />
          </div>
          <p className="text-[18px] font-semibold tracking-tight text-text-primary">{plan.day1}</p>
          <p className="text-[13px] text-text-secondary mt-1">Start here and keep the momentum daily.</p>
        </motion.div>
      </main>

      <motion.footer
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...transition, delay: shouldReduceMotion ? 0 : 0.12 }}
        className="sticky bottom-0 bg-bg-base/96 backdrop-blur-sm border-t border-border/70 px-6 pt-4 pb-7"
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={handleStartReading}
          className="btn-primary w-full min-h-12 mb-3"
        >
          Start Reading Day 1
        </motion.button>

        <button
          onClick={() => navigate('/home')}
          className="w-full min-h-11 text-[15px] text-text-secondary hover:text-text-primary transition-colors"
        >
          Go to my dashboard
        </button>
      </motion.footer>
    </div>
  );
}
